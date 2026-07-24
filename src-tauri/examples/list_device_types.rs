//! Print each transcribe-cpp device with its DeviceType axis — sanity check
//! for the hardware-aware onboarding default (dedicated GPU detection).

fn main() {
    let exe = std::env::current_exe().expect("exe path");
    let scan_dir = exe.parent().and_then(|p| p.parent()).expect("target dir");
    let _ = transcribe_cpp::init_backends(scan_dir);
    for d in transcribe_cpp::devices() {
        println!(
            "index={:?} kind={} type={:?} name={} desc={}",
            d.index, d.kind, d.device_type, d.name, d.description
        );
    }
}
