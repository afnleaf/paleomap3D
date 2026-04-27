/*
instance_pipeline_webgl2.rs

WebGL2 compatible render pipeline.
Same as instance_pipeline.rs but uses a 2D texture for elevation data
instead of a storage buffer (which WebGL2 does not support).

transpiled by claude 4.6 opus max from the webgpu version (instance_pipeline.rs)
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
        view::{
            ExtractedView,
        },
        Render, RenderApp, RenderSet,
    },
};
use std::mem::size_of;

use crate::earth::{
    AllMapData,
    InstanceData,
    InstanceMaterialData,
    ResolutionMode,
};
use crate::sun::SunPosition;
use crate::mapupdate::CurrentMap;


// WebGL2 shader
const SHADER_ASSET_PATH: &str = "shaders/instancing_webgl2.wgsl";

// texture dimensions for packing elevation data
// width must be multiple of 64 for wgpu copy alignment (bytes_per_row % 256 == 0)
const TEXTURE_WIDTH: u32 = 4096;
const POINTS_PER_MAP: u32 = 65341;
const NUM_MAPS: u32 = 109;

// plugin ---------------------------------------------------------------------

pub struct CustomMaterialPlugin;

impl Plugin for CustomMaterialPlugin {
    fn build(&self, app: &mut App) {
        app.add_plugins((
            ExtractComponentPlugin::<InstanceMaterialData>::default(),
            ExtractResourcePlugin::<AllMapData>::default(),
            ExtractResourcePlugin::<CurrentMap>::default(),
            ExtractResourcePlugin::<SunPosition>::default(),
        ));
        app.sub_app_mut(RenderApp)
            .add_render_command::<Transparent3d, DrawCustom>()
            .init_resource::<SpecializedMeshPipelines<CustomPipeline>>()
            .add_systems(
                Render,
                (
                    prepare_instance_buffers
                        .in_set(RenderSet::PrepareResources),

                    update_map_from_main_world
                        .in_set(RenderSet::PrepareResources)
                        .after(prepare_instance_buffers),

                    update_sun_from_main_world
                        .in_set(RenderSet::PrepareResources)
                        .after(prepare_instance_buffers),

                    queue_custom.in_set(RenderSet::QueueMeshes),
                ),
            );
    }

    fn finish(&self, app: &mut App) {
        app.sub_app_mut(RenderApp).init_resource::<CustomPipeline>();
    }
}

// GPU resources --------------------------------------------------------------

#[derive(Component)]
struct InstanceBuffer {
    buffer: Buffer,
    length: usize,
}

// texture instead of storage buffer for elevation data
#[derive(Resource)]
struct ElevationTextureResource {
    view: TextureView,
}

#[derive(Resource)]
pub struct MapSelectionUniformBuffer {
    pub buffer: Buffer,
    pub current_map: u32,
}

#[derive(Resource)]
pub struct SunPositionUniformBuffer {
    pub buffer: Buffer,
    pub position: Vec3,
}

#[derive(Resource)]
struct ElevationBindGroup {
    bind_group: BindGroup,
}


// PREPARE --------------------------------------------------------------------

fn prepare_instance_buffers(
    mut commands: Commands,
    query: Query<(Entity, &InstanceMaterialData)>,
    render_device: Res<RenderDevice>,
    render_queue: Res<RenderQueue>,
    all_maps: Option<Res<AllMapData>>,
    existing_elevation: Option<Res<ElevationTextureResource>>,
    existing_map_selection: Option<Res<MapSelectionUniformBuffer>>,
    existing_sun_position: Option<Res<SunPositionUniformBuffer>>,
) {
    // instance buffer creation (same as webgpu)
    for (entity, instance_data) in &query {
        let instance_buffer =
        render_device.create_buffer_with_data(&BufferInitDescriptor {
            label: Some("instance data buffer"),
            contents: bytemuck::cast_slice(instance_data.as_slice()),
            usage: BufferUsages::VERTEX | BufferUsages::COPY_DST,
        });
        commands.entity(entity).insert(InstanceBuffer {
            buffer: instance_buffer,
            length: instance_data.len(),
        });
    }

    // elevation data as 2D texture instead of storage buffer
    if let Some(all_maps) = all_maps {
        if existing_elevation.is_none() {
            let total_points = NUM_MAPS * POINTS_PER_MAP;
            let texture_height = (total_points + TEXTURE_WIDTH - 1) / TEXTURE_WIDTH;
            let total_pixels = TEXTURE_WIDTH * texture_height;

            println!(
                "Creating elevation texture {}x{} ({} total points)",
                TEXTURE_WIDTH, texture_height, total_points
            );

            // widen the flat i32 buffer to f32 and pad to fill texture
            let mut elevation_f32: Vec<f32> = all_maps.buffer
                .iter()
                .map(|&v| v as f32)
                .collect();
            // pad remainder of last row with zeros
            elevation_f32.resize(total_pixels as usize, 0.0);

            // create the texture
            let texture = render_device.create_texture(&TextureDescriptor {
                label: Some("elevation texture"),
                size: Extent3d {
                    width: TEXTURE_WIDTH,
                    height: texture_height,
                    depth_or_array_layers: 1,
                },
                mip_level_count: 1,
                sample_count: 1,
                dimension: TextureDimension::D2,
                format: TextureFormat::R32Float,
                usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
                view_formats: &[],
            });

            // write elevation data into texture
            render_queue.write_texture(
                texture.as_image_copy(),
                bytemuck::cast_slice(&elevation_f32),
                TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: Some(TEXTURE_WIDTH * 4), // 4 bytes per f32
                    rows_per_image: Some(texture_height),
                },
                Extent3d {
                    width: TEXTURE_WIDTH,
                    height: texture_height,
                    depth_or_array_layers: 1,
                },
            );

            let view = texture.create_view(&TextureViewDescriptor::default());

            commands.insert_resource(ElevationTextureResource { view });
        }
    } else {
        println!("WARNING: AllMapData resource not found!");
    }

    // map selection uniform buffer (includes texture_width for shader)
    if existing_map_selection.is_none() {
        println!("Creating map selection uniform buffer");

        // map_id, points_per_map, texture_width, padding
        let map_data: [u32; 4] = [0, POINTS_PER_MAP, TEXTURE_WIDTH, 0];

        let map_buffer =
        render_device.create_buffer_with_data(&BufferInitDescriptor {
            label: Some("map selection uniform buffer"),
            contents: bytemuck::cast_slice(&map_data),
            usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
        });

        commands.insert_resource(MapSelectionUniformBuffer {
            buffer: map_buffer,
            current_map: 0,
        });
    }

    // sun position uniform buffer (same as webgpu)
    if existing_sun_position.is_none() {
        println!("Creating sun position uniform buffer");

        let sun_data: [f32; 4] = [149_000.0, 0.0, 0.0, 1.0];

        let sun_buffer =
        render_device.create_buffer_with_data(&BufferInitDescriptor {
            label: Some("sun position uniform buffer"),
            contents: bytemuck::cast_slice(&sun_data),
            usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
        });

        commands.insert_resource(SunPositionUniformBuffer {
            buffer: sun_buffer,
            position: Vec3::new(149_000.0, 0.0, 0.0),
        });
    }
}

// PIPELINE -------------------------------------------------------------------

#[derive(Resource)]
struct CustomPipeline {
    shader: Handle<Shader>,
    mesh_pipeline: MeshPipeline,
    elevation_bind_group_layout: BindGroupLayout,
}

impl FromWorld for CustomPipeline {
    fn from_world(world: &mut World) -> Self {
        let render_device = world.resource::<RenderDevice>();
        let mesh_pipeline = world.resource::<MeshPipeline>();

        let elevation_bind_group_layout =
        render_device.create_bind_group_layout(
            Some("elevation_bind_group_layout"),
            &[
                // binding 0: elevation texture (instead of storage buffer)
                BindGroupLayoutEntry {
                    binding: 0,
                    visibility: ShaderStages::VERTEX,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                // binding 1: map selection uniform buffer
                BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::VERTEX,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                // binding 2: sun position uniform buffer
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

        CustomPipeline {
            shader: world.load_asset(SHADER_ASSET_PATH),
            mesh_pipeline: mesh_pipeline.clone(),
            elevation_bind_group_layout,
        }
    }
}

// vertex buffer layout is identical to webgpu version
impl SpecializedMeshPipeline for CustomPipeline {
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

        descriptor.vertex.buffers.push(VertexBufferLayout {
            array_stride: size_of::<InstanceData>() as u64,
            step_mode: VertexStepMode::Instance,
            attributes: vec![
                // position @location(3)
                VertexAttribute {
                    format: VertexFormat::Float32x3,
                    offset: 0,
                    shader_location: 3,
                },
                // scale @location(4)
                VertexAttribute {
                    format: VertexFormat::Float32x3,
                    offset: 12,
                    shader_location: 4,
                },
                // rotation @location(5)
                VertexAttribute {
                    format: VertexFormat::Float32x4,
                    offset: 32,
                    shader_location: 5,
                },
                // color @location(6)
                VertexAttribute {
                    format: VertexFormat::Float32x4,
                    offset: 48,
                    shader_location: 6,
                },
                // elevation index @location(7)
                VertexAttribute {
                    format: VertexFormat::Uint32,
                    offset: 64,
                    shader_location: 7,
                }
            ],
        });
        Ok(descriptor)
    }
}


// QUEUE ----------------------------------------------------------------------

fn queue_custom(
    transparent_3d_draw_functions: Res<DrawFunctions<Transparent3d>>,
    custom_pipeline: Res<CustomPipeline>,
    mut pipelines: ResMut<SpecializedMeshPipelines<CustomPipeline>>,
    pipeline_cache: Res<PipelineCache>,
    meshes: Res<RenderAssets<RenderMesh>>,
    render_mesh_instances: Res<RenderMeshInstances>,
    material_meshes: Query<(Entity, &MainEntity), With<InstanceMaterialData>>,
    mut transparent_render_phases: ResMut<ViewSortedRenderPhases<Transparent3d>>,
    views: Query<(&ExtractedView, &Msaa)>,
    render_device: Res<RenderDevice>,
    elevation_texture: Option<Res<ElevationTextureResource>>,
    map_selection: Option<Res<MapSelectionUniformBuffer>>,
    sun_position: Option<Res<SunPositionUniformBuffer>>,
    existing_bind_group: Option<Res<ElevationBindGroup>>,
    resolution_mode: Option<Res<ResolutionMode>>,
    mut commands: Commands,
) {
    // skip queueing 1deg cubes when the user is viewing 6min. avoids
    // z-fighting between 1deg and 6min instances on toggle. the bind group
    // we already created stays resident, so toggling back to 1deg is free.
    if let Some(mode) = resolution_mode.as_deref() {
        if mode.mode != 0 { return; }
    }

    // create bind group with texture view instead of storage buffer
    if let (Some(elevation_texture), Some(map_selection), Some(sun_position)) =
    (elevation_texture, map_selection, sun_position) {
        if existing_bind_group.is_none() {
            let bind_group = render_device.create_bind_group(
                Some("elevation_bind_group"),
                &custom_pipeline.elevation_bind_group_layout,
                &[
                    // texture view instead of buffer binding
                    BindGroupEntry {
                        binding: 0,
                        resource: BindingResource::TextureView(&elevation_texture.view),
                    },
                    BindGroupEntry {
                        binding: 1,
                        resource: map_selection.buffer.as_entire_binding(),
                    },
                    BindGroupEntry {
                        binding: 2,
                        resource: sun_position.buffer.as_entire_binding(),
                    },
                ]
            );

            commands.insert_resource(ElevationBindGroup { bind_group });
        }
    }

    let draw_custom = transparent_3d_draw_functions.read().id::<DrawCustom>();

    for (view, msaa) in &views {
        let Some(transparent_phase) = transparent_render_phases.get_mut(
                                                    &view.retained_view_entity)
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
                                                mesh.primitive_topology());

            let pipeline = pipelines
                .specialize(
                    &pipeline_cache, &custom_pipeline,
                    key, &mesh.layout
                )
                .unwrap();

            transparent_phase.add(Transparent3d {
                entity: (entity, *main_entity),
                pipeline,
                draw_function: draw_custom,
                distance: rangefinder.distance_translation(
                            &mesh_instance.translation),
                batch_range: 0..1,
                extra_index: PhaseItemExtraIndex::None,
                indexed: true,
            });
        }
    }
}

// DRAW -----------------------------------------------------------------------

type DrawCustom = (
    SetItemPipeline,
    SetMeshViewBindGroup<0>,
    SetMeshBindGroup<1>,
    SetElevationBindGroup<2>,
    DrawMeshInstanced,
);

struct SetElevationBindGroup<const I: usize>;

impl<P: PhaseItem, const I: usize> RenderCommand<P> for SetElevationBindGroup<I> {
    type Param = Option<SRes<ElevationBindGroup>>;
    type ViewQuery = ();
    type ItemQuery = ();

    fn render<'w>(
        item: &P,
        _view: (),
        _item_query: Option<()>,
        elevation_bind_group: SystemParamItem<'w, '_, Self::Param>,
        pass: &mut TrackedRenderPass<'w>,
    ) -> RenderCommandResult {
        if let Some(elevation_bind_group) = elevation_bind_group {
            let elevation_bind_group = elevation_bind_group.into_inner();
            pass.set_bind_group(I, &elevation_bind_group.bind_group, &[]);
            RenderCommandResult::Success
        } else {
            RenderCommandResult::Skip
        }
    }
}


struct DrawMeshInstanced;

impl<P: PhaseItem> RenderCommand<P> for DrawMeshInstanced {
    type Param = (
        SRes<RenderAssets<RenderMesh>>,
        SRes<RenderMeshInstances>,
        SRes<MeshAllocator>,
    );
    type ViewQuery = ();
    type ItemQuery = Read<InstanceBuffer>;

    #[inline]
    fn render<'w>(
        item: &P,
        _view: (),
        instance_buffer: Option<&'w InstanceBuffer>,
        (meshes,
        render_mesh_instances,
        mesh_allocator): SystemParamItem<'w, '_, Self::Param>,
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

        let Some(instance_buffer) = instance_buffer else {
            return RenderCommandResult::Skip;
        };

        let Some(vertex_buffer_slice) =
            mesh_allocator.mesh_vertex_slice(&mesh_instance.mesh_asset_id)
        else {
            return RenderCommandResult::Skip;
        };

        pass.set_vertex_buffer(0, vertex_buffer_slice.buffer.slice(..));
        pass.set_vertex_buffer(1, instance_buffer.buffer.slice(..));

        match &gpu_mesh.buffer_info {
            RenderMeshBufferInfo::Indexed {
                index_format,
                count,
            } => {
                let Some(index_buffer_slice) =
                    mesh_allocator.mesh_index_slice(&mesh_instance.mesh_asset_id)
                else {
                    return RenderCommandResult::Skip;
                };

                pass.set_index_buffer(
                    index_buffer_slice.buffer.slice(..),
                    0, *index_format
                );

                pass.draw_indexed(
                    index_buffer_slice.range.start..(
                        index_buffer_slice.range.start + count
                    ),
                    vertex_buffer_slice.range.start as i32,
                    0..instance_buffer.length as u32,
                );
            }
            RenderMeshBufferInfo::NonIndexed => {
                pass.draw(
                    vertex_buffer_slice.range,
                    0..instance_buffer.length as u32
                );
            }
        }

        RenderCommandResult::Success
    }
}

// MAP SWITCH -----------------------------------------------------------------

fn update_map_from_main_world(
    render_queue: Res<RenderQueue>,
    current_map: Option<Res<CurrentMap>>,
    mut map_selection: Option<ResMut<MapSelectionUniformBuffer>>,
) {
    if let (Some(current_map), Some(mut map_selection)) =
    (current_map, map_selection) {
        if map_selection.current_map != current_map.index as u32 {
            println!("Map index changed! Updating GPU buffer from {} to {}.", map_selection.current_map, current_map.index);

            let new_map_id = current_map.index as u32;
            map_selection.current_map = new_map_id;

            // map_id, points_per_map, texture_width, padding
            let data: [u32; 4] = [new_map_id, POINTS_PER_MAP, TEXTURE_WIDTH, 0];
            render_queue.write_buffer(
                &map_selection.buffer,
                0,
                bytemuck::cast_slice(&data),
            );
        }
    }
}

fn update_sun_from_main_world(
    render_queue: Res<RenderQueue>,
    sun_position: Option<Res<SunPosition>>,
    mut sun_position_buffer: Option<ResMut<SunPositionUniformBuffer>>,
) {
    if let (Some(sun_position), Some(mut sun_position_buffer)) =
    (sun_position, sun_position_buffer) {
            let n = sun_position.pos;
            sun_position_buffer.position = n;

            let data: [f32; 4] = [n.x, n.y, n.z, 1.0];
            render_queue.write_buffer(
                &sun_position_buffer.buffer,
                0,
                bytemuck::cast_slice(&data),
            );
    }
}
