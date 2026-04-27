/*
instance_pipeline_6min_webgl2.rs

WebGL2 render pipeline for the 6min resolution path. Parallel to
instance_pipeline_webgl2.rs (the 1deg path) but with two key differences:

  1. no per-instance vertex buffer. (i, j) are derived from
     @builtin(instance_index) inside the shader, saving ~519 MB of CPU+GPU
     instance memory at this resolution.
  2. lat trig + lon-scale precomputed into a tiny 1801x1 RGBA32F LUT
     (instead of being uploaded per instance).

Elevation is uploaded as a R16Sint 3601x1801 texture, re-uploaded only on
map change.
*/

use bevy::{
    prelude::*,
    core_pipeline::core_3d::Transparent3d,
    ecs::{
        system::{lifetimeless::*, SystemParamItem},
    },
    pbr::{
        MeshPipeline, MeshPipelineKey, RenderMeshInstances,
        SetMeshBindGroup, SetMeshViewBindGroup,
    },
    render::{
        extract_component::ExtractComponentPlugin,
        extract_resource::ExtractResourcePlugin,
        mesh::{
            allocator::MeshAllocator, MeshVertexBufferLayoutRef,
            RenderMesh, RenderMeshBufferInfo,
        },
        render_asset::RenderAssets,
        render_phase::{
            AddRenderCommand, DrawFunctions, PhaseItem, PhaseItemExtraIndex,
            RenderCommand, RenderCommandResult, SetItemPipeline,
            TrackedRenderPass, ViewSortedRenderPhases,
        },
        render_resource::*,
        renderer::{RenderDevice, RenderQueue},
        sync_world::MainEntity,
        view::ExtractedView,
        Render, RenderApp, RenderSet,
    },
};

use crate::earth::{Big6minData, Earth6min, LatLutData, ResolutionMode};
use crate::instance_pipeline_webgl2::SunPositionUniformBuffer;
use crate::mapupdate::CurrentMap;


const SHADER_ASSET_PATH: &str = "shaders/instancing_6min_webgl2.wgsl";

// active elevation texture: natural 3601x1801 R16Sint.
const TEX_W: u32 = 3601;
const TEX_H: u32 = 1801;
// natural row stride: 3601 * 2 = 7202 (NOT 256-aligned).
// padded to next multiple of 256 for wgpu bytes_per_row constraint.
const BYTES_PER_ROW_NATURAL: usize = 7202;
const BYTES_PER_ROW_PADDED: u32 = 7424;
const SCRATCH_SIZE: usize =
    (BYTES_PER_ROW_PADDED as usize) * (TEX_H as usize);
// 1801 * 3601 * 2 bytes per i16 = 12,970,802 bytes per map.
const PER_MAP_SIZE: usize = 1801 * 3601 * 2;
// total instances drawn per frame.
const INSTANCE_COUNT: u32 = 1801 * 3601;


// plugin ---------------------------------------------------------------------

pub struct CustomMaterialPlugin;

impl Plugin for CustomMaterialPlugin {
    fn build(&self, app: &mut App) {
        // CurrentMap and SunPosition are already extracted by the 1deg
        // pipeline plugin; bevy panics on duplicate plugin registration so
        // we don't redeclare them here.
        app.add_plugins((
            ExtractComponentPlugin::<Earth6min>::default(),
            ExtractResourcePlugin::<Big6minData>::default(),
            ExtractResourcePlugin::<LatLutData>::default(),
            ExtractResourcePlugin::<ResolutionMode>::default(),
        ));
        app.sub_app_mut(RenderApp)
            .init_resource::<Active6minMapId>()
            .add_render_command::<Transparent3d, DrawCustom6min>()
            .init_resource::<SpecializedMeshPipelines<CustomPipeline6min>>()
            .add_systems(
                Render,
                (
                    prepare_6min_resources.in_set(RenderSet::PrepareResources),
                    queue_custom_6min.in_set(RenderSet::QueueMeshes),
                ),
            );
    }

    fn finish(&self, app: &mut App) {
        app.sub_app_mut(RenderApp).init_resource::<CustomPipeline6min>();
    }
}


// GPU resources --------------------------------------------------------------

#[derive(Resource)]
struct LatLutTexture {
    view: TextureView,
}

#[derive(Resource)]
struct ActiveElevTexture {
    texture: Texture,
    view: TextureView,
}

// tracks which map is currently sitting in the active-elev texture so we
// know when to re-upload. None means "nothing uploaded yet".
#[derive(Resource, Default)]
struct Active6minMapId(Option<u32>);

#[derive(Resource)]
struct ElevationBindGroup6min {
    bind_group: BindGroup,
}


// PREPARE --------------------------------------------------------------------

fn prepare_6min_resources(
    mut commands: Commands,
    render_device: Res<RenderDevice>,
    render_queue: Res<RenderQueue>,
    lat_lut_data: Option<Res<LatLutData>>,
    big6min: Option<Res<Big6minData>>,
    current_map: Option<Res<CurrentMap>>,
    resolution_mode: Option<Res<ResolutionMode>>,
    existing_lat_lut_tex: Option<Res<LatLutTexture>>,
    existing_active_elev: Option<Res<ActiveElevTexture>>,
    active_id: Option<ResMut<Active6minMapId>>,
    mut scratch: Local<Vec<u8>>,
) {
    // build lat LUT texture once, the first frame the LUT data appears.
    // 1801x1, RGBA32F. one row, so bytes_per_row = None is valid.
    if existing_lat_lut_tex.is_none() {
        if let Some(lut) = lat_lut_data.as_deref() {
            let texture = render_device.create_texture(&TextureDescriptor {
                label: Some("6min lat LUT texture"),
                size: Extent3d {
                    width: 1801,
                    height: 1,
                    depth_or_array_layers: 1,
                },
                mip_level_count: 1,
                sample_count: 1,
                dimension: TextureDimension::D2,
                format: TextureFormat::Rgba32Float,
                usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
                view_formats: &[],
            });
            render_queue.write_texture(
                texture.as_image_copy(),
                bytemuck::cast_slice(lut.rows.as_slice()),
                TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: None,
                    rows_per_image: None,
                },
                Extent3d {
                    width: 1801,
                    height: 1,
                    depth_or_array_layers: 1,
                },
            );
            let view = texture.create_view(&TextureViewDescriptor::default());
            commands.insert_resource(LatLutTexture { view });
        }
    }

    // create the active elevation texture once. allocation only - the
    // first map upload happens on the next frame's prepare pass once mode
    // is 1 and Big6minData is present.
    if existing_active_elev.is_none() {
        let texture = render_device.create_texture(&TextureDescriptor {
            label: Some("6min active elevation texture"),
            size: Extent3d {
                width: TEX_W,
                height: TEX_H,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: TextureDimension::D2,
            format: TextureFormat::R16Sint,
            usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
            view_formats: &[],
        });
        let view = texture.create_view(&TextureViewDescriptor::default());
        commands.insert_resource(ActiveElevTexture { texture, view });
        return;
    }

    // re-upload only when the user is in 6min mode AND the active-elev map
    // is stale. Active6minMapId starts None so the first toggle to 6min
    // always uploads.
    let Some(mode) = resolution_mode else { return };
    if mode.mode != 1 { return; }
    let Some(big) = big6min else { return };
    let Some(cm) = current_map else { return };
    let Some(mut active_id) = active_id else { return };
    let Some(active_elev) = existing_active_elev else { return };

    let want = cm.index as u32;
    if active_id.0 == Some(want) { return; }

    // allocate scratch on first use (~13.4 MB; reused for every map change).
    if scratch.len() != SCRATCH_SIZE {
        *scratch = vec![0u8; SCRATCH_SIZE];
    }

    let bytes = big.bytes.as_slice();
    let off = (want as usize) * PER_MAP_SIZE;
    for i in 0..(TEX_H as usize) {
        let dst = i * (BYTES_PER_ROW_PADDED as usize);
        let src = off + i * BYTES_PER_ROW_NATURAL;
        scratch[dst..dst + BYTES_PER_ROW_NATURAL]
            .copy_from_slice(&bytes[src..src + BYTES_PER_ROW_NATURAL]);
    }

    render_queue.write_texture(
        active_elev.texture.as_image_copy(),
        scratch.as_slice(),
        TexelCopyBufferLayout {
            offset: 0,
            bytes_per_row: Some(BYTES_PER_ROW_PADDED),
            rows_per_image: Some(TEX_H),
        },
        Extent3d {
            width: TEX_W,
            height: TEX_H,
            depth_or_array_layers: 1,
        },
    );

    active_id.0 = Some(want);
    println!("6min active-elev uploaded for map {}", want);
}


// PIPELINE -------------------------------------------------------------------

#[derive(Resource)]
struct CustomPipeline6min {
    shader: Handle<Shader>,
    mesh_pipeline: MeshPipeline,
    elevation_bind_group_layout: BindGroupLayout,
}

impl FromWorld for CustomPipeline6min {
    fn from_world(world: &mut World) -> Self {
        let render_device = world.resource::<RenderDevice>();
        let mesh_pipeline = world.resource::<MeshPipeline>();

        let elevation_bind_group_layout =
        render_device.create_bind_group_layout(
            Some("6min_bind_group_layout"),
            &[
                // binding 0: lat LUT (RGBA32F, vertex)
                BindGroupLayoutEntry {
                    binding: 0,
                    visibility: ShaderStages::VERTEX,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float {
                            filterable: false,
                        },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                // binding 1: active elevation (R16Sint -> Sint sample type)
                BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::VERTEX,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Sint,
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                // binding 2: sun position uniform (fragment)
                BindGroupLayoutEntry {
                    binding: 2,
                    visibility: ShaderStages::FRAGMENT,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        );

        CustomPipeline6min {
            shader: world.load_asset(SHADER_ASSET_PATH),
            mesh_pipeline: mesh_pipeline.clone(),
            elevation_bind_group_layout,
        }
    }
}

impl SpecializedMeshPipeline for CustomPipeline6min {
    type Key = MeshPipelineKey;

    fn specialize(
        &self,
        key: Self::Key,
        layout: &MeshVertexBufferLayoutRef,
    ) -> Result<RenderPipelineDescriptor, SpecializedMeshPipelineError> {
        let mut descriptor = self.mesh_pipeline.specialize(key, layout)?;

        descriptor.vertex.shader = self.shader.clone();
        descriptor.fragment.as_mut().unwrap().shader = self.shader.clone();

        descriptor.layout.push(self.elevation_bind_group_layout.clone());

        // no per-instance vertex buffer pushed. shader uses
        // @builtin(instance_index) to derive (i, j).

        Ok(descriptor)
    }
}


// QUEUE ----------------------------------------------------------------------

fn queue_custom_6min(
    transparent_3d_draw_functions: Res<DrawFunctions<Transparent3d>>,
    custom_pipeline: Res<CustomPipeline6min>,
    mut pipelines: ResMut<SpecializedMeshPipelines<CustomPipeline6min>>,
    pipeline_cache: Res<PipelineCache>,
    meshes: Res<RenderAssets<RenderMesh>>,
    render_mesh_instances: Res<RenderMeshInstances>,
    material_meshes: Query<(Entity, &MainEntity), With<Earth6min>>,
    mut transparent_render_phases: ResMut<ViewSortedRenderPhases<Transparent3d>>,
    views: Query<(&ExtractedView, &Msaa)>,
    render_device: Res<RenderDevice>,
    resolution_mode: Option<Res<ResolutionMode>>,
    lat_lut_tex: Option<Res<LatLutTexture>>,
    active_elev_tex: Option<Res<ActiveElevTexture>>,
    sun_uniform: Option<Res<SunPositionUniformBuffer>>,
    existing_bind_group: Option<Res<ElevationBindGroup6min>>,
    mut commands: Commands,
) {
    // gate on mode == 1 (skips work and prevents z-fighting with 1deg path).
    // we don't need to track Active6minMapId here: prepare_6min_resources
    // runs in PrepareResources (set boundary -> command flush before
    // QueueMeshes), so by the time we get here on the toggle frame, the
    // active-elev texture is uploaded for the current map.
    let Some(mode) = resolution_mode.as_deref() else { return };
    if mode.mode != 1 { return; }

    // build the bind group once all of (lat_lut_tex, active_elev_tex,
    // sun_uniform) are present. SunPositionUniformBuffer is created by the
    // 1deg pipeline's prepare; we just borrow it.
    let (Some(lat_lut_tex), Some(active_elev_tex), Some(sun_uniform)) =
        (lat_lut_tex, active_elev_tex, sun_uniform)
    else {
        return;
    };

    if existing_bind_group.is_none() {
        let bind_group = render_device.create_bind_group(
            Some("6min elevation bind group"),
            &custom_pipeline.elevation_bind_group_layout,
            &[
                BindGroupEntry {
                    binding: 0,
                    resource: BindingResource::TextureView(&lat_lut_tex.view),
                },
                BindGroupEntry {
                    binding: 1,
                    resource: BindingResource::TextureView(&active_elev_tex.view),
                },
                BindGroupEntry {
                    binding: 2,
                    resource: sun_uniform.buffer.as_entire_binding(),
                },
            ],
        );
        commands.insert_resource(ElevationBindGroup6min { bind_group });
    }

    let draw = transparent_3d_draw_functions.read().id::<DrawCustom6min>();

    for (view, msaa) in &views {
        let Some(transparent_phase) = transparent_render_phases
            .get_mut(&view.retained_view_entity)
        else {
            continue;
        };

        let msaa_key = MeshPipelineKey::from_msaa_samples(msaa.samples());
        let view_key = msaa_key | MeshPipelineKey::from_hdr(view.hdr);
        let rangefinder = view.rangefinder3d();

        for (entity, main_entity) in &material_meshes {
            let Some(mesh_instance) = render_mesh_instances
                .render_mesh_queue_data(*main_entity)
            else {
                continue;
            };

            let Some(mesh) = meshes.get(mesh_instance.mesh_asset_id) else {
                continue;
            };

            let key =
                view_key | MeshPipelineKey::from_primitive_topology(
                    mesh.primitive_topology()
                );

            let pipeline = pipelines
                .specialize(
                    &pipeline_cache, &custom_pipeline,
                    key, &mesh.layout,
                )
                .unwrap();

            transparent_phase.add(Transparent3d {
                entity: (entity, *main_entity),
                pipeline,
                draw_function: draw,
                distance: rangefinder.distance_translation(
                    &mesh_instance.translation,
                ),
                batch_range: 0..1,
                extra_index: PhaseItemExtraIndex::None,
                indexed: true,
            });
        }
    }
}


// DRAW -----------------------------------------------------------------------

type DrawCustom6min = (
    SetItemPipeline,
    SetMeshViewBindGroup<0>,
    SetMeshBindGroup<1>,
    SetElevationBindGroup6min<2>,
    DrawMeshInstanced6min,
);

struct SetElevationBindGroup6min<const I: usize>;

impl<P: PhaseItem, const I: usize> RenderCommand<P>
    for SetElevationBindGroup6min<I>
{
    type Param = Option<SRes<ElevationBindGroup6min>>;
    type ViewQuery = ();
    type ItemQuery = ();

    fn render<'w>(
        _item: &P,
        _view: (),
        _item_query: Option<()>,
        bg: SystemParamItem<'w, '_, Self::Param>,
        pass: &mut TrackedRenderPass<'w>,
    ) -> RenderCommandResult {
        if let Some(bg) = bg {
            let bg = bg.into_inner();
            pass.set_bind_group(I, &bg.bind_group, &[]);
            RenderCommandResult::Success
        } else {
            RenderCommandResult::Skip
        }
    }
}


struct DrawMeshInstanced6min;

impl<P: PhaseItem> RenderCommand<P> for DrawMeshInstanced6min {
    type Param = (
        SRes<RenderAssets<RenderMesh>>,
        SRes<RenderMeshInstances>,
        SRes<MeshAllocator>,
    );
    type ViewQuery = ();
    type ItemQuery = ();

    #[inline]
    fn render<'w>(
        item: &P,
        _view: (),
        _item_query: Option<()>,
        (meshes, render_mesh_instances, mesh_allocator):
            SystemParamItem<'w, '_, Self::Param>,
        pass: &mut TrackedRenderPass<'w>,
    ) -> RenderCommandResult {
        let mesh_allocator = mesh_allocator.into_inner();

        let Some(mesh_instance) = render_mesh_instances
            .render_mesh_queue_data(item.main_entity())
        else {
            return RenderCommandResult::Skip;
        };

        let Some(gpu_mesh) = meshes.into_inner()
            .get(mesh_instance.mesh_asset_id)
        else {
            return RenderCommandResult::Skip;
        };

        let Some(vertex_buffer_slice) =
            mesh_allocator.mesh_vertex_slice(&mesh_instance.mesh_asset_id)
        else {
            return RenderCommandResult::Skip;
        };

        // base prism vertex buffer at slot 0. no instance buffer at slot 1
        // because the shader derives (i, j) from @builtin(instance_index).
        pass.set_vertex_buffer(0, vertex_buffer_slice.buffer.slice(..));

        match &gpu_mesh.buffer_info {
            RenderMeshBufferInfo::Indexed { index_format, count } => {
                let Some(index_buffer_slice) =
                    mesh_allocator.mesh_index_slice(&mesh_instance.mesh_asset_id)
                else {
                    return RenderCommandResult::Skip;
                };

                pass.set_index_buffer(
                    index_buffer_slice.buffer.slice(..),
                    0, *index_format,
                );

                pass.draw_indexed(
                    index_buffer_slice.range.start..(
                        index_buffer_slice.range.start + count
                    ),
                    vertex_buffer_slice.range.start as i32,
                    0..INSTANCE_COUNT,
                );
            }
            RenderMeshBufferInfo::NonIndexed => {
                pass.draw(vertex_buffer_slice.range, 0..INSTANCE_COUNT);
            }
        }

        RenderCommandResult::Success
    }
}
