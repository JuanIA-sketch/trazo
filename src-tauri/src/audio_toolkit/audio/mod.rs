// Re-export all audio components
mod device;
mod input_gain;
mod recorder;
mod resampler;
mod silence_gate;
mod utils;
mod visualizer;

pub use device::{list_input_devices, list_output_devices, CpalDeviceInfo};
pub use input_gain::{apply_input_gain, MAX_GAIN, MIN_GAIN, UNITY_GAIN};
pub use recorder::{
    is_microphone_access_denied, is_no_input_device_error, AudioRecorder, VadPolicy,
};
pub use resampler::FrameResampler;
pub use silence_gate::{
    looks_truncated, looks_truncated_by_duration, speech_seconds, speech_segments,
    trim_sustained_silence,
};
pub use utils::{read_wav_samples, save_wav_file, verify_wav_file};
pub use visualizer::AudioVisualiser;
