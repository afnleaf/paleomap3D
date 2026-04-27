/*
render_backend.rs

detects which graphics backend is available at runtime
and activates the correct render pipeline.

WebGPU: storage buffer pipeline (instance_pipeline_webgpu)
WebGL2: texture pipeline (instance_pipeline_webgl2)

detection happens in finish() where RenderDevice exists.

transpiled by claude 4.6 opus max
*/

use bevy::{
    prelude::*,
    render::{
        renderer::RenderDevice,
        RenderApp,
    },
};

use crate::instance_pipeline_webgpu;
use crate::instance_pipeline_webgl2;
use crate::instance_pipeline_6min_webgl2;

pub struct RenderBackendPlugin;

impl Plugin for RenderBackendPlugin {
    fn build(&self, _app: &mut App) {
        // nothing here, we defer everything to finish()
        // where we can check what the render device supports
    }

    fn finish(&self, app: &mut App) {
        let render_device = app
            .sub_app(RenderApp)
            .world()
            .resource::<RenderDevice>();

        let use_storage_buffers =
            render_device.limits().max_storage_buffers_per_shader_stage > 0;

        if use_storage_buffers {
            println!("Render backend: WebGPU (storage buffers)");
            instance_pipeline_webgpu::CustomMaterialPlugin.build(app);
            instance_pipeline_webgpu::CustomMaterialPlugin.finish(app);
            // 6min path is WebGL2-only for now (the texture-LUT design
            // depends on the texture-fallback bind layout). WebGPU stays
            // 1deg-only this pass.
        } else {
            println!("Render backend: WebGL2 (texture fallback)");
            instance_pipeline_webgl2::CustomMaterialPlugin.build(app);
            instance_pipeline_webgl2::CustomMaterialPlugin.finish(app);
            instance_pipeline_6min_webgl2::CustomMaterialPlugin.build(app);
            instance_pipeline_6min_webgl2::CustomMaterialPlugin.finish(app);
        }
    }
}
