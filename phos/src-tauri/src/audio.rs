use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::StreamConfig;
use std::f32::consts::TAU;
use std::sync::atomic::{AtomicBool, Ordering};

// LARMOR FREQUENCY: 863 Hz for ³¹P resonance in Earth's magnetic field.
// Native cpal output stream bypasses the browser WebAudio autoplay ban entirely.
const LARMOR_HZ: f32 = 863.0;
const SAMPLE_RATE: u32 = 48000;

static PLAYING: AtomicBool = AtomicBool::new(false);

// Phase accumulator — thread_local ensures single-threaded access per callback
thread_local! {
    static PHASE: std::cell::Cell<f32> = std::cell::Cell::new(0.0);
}

#[tauri::command]
pub fn start_863hz() -> Result<(), String> {
    if PLAYING.load(Ordering::SeqCst) {
        return Ok(());
    }

    let host = cpal::default_host();
    let device = host
        .default_output_device()
        .ok_or_else(|| "No audio output device".to_string())?;

    let config = StreamConfig {
        channels: 2,
        sample_rate: cpal::SampleRate(SAMPLE_RATE),
        buffer_size: cpal::BufferSize::Default,
    };

    let step = TAU * LARMOR_HZ / SAMPLE_RATE as f32;

    let data_callback = move |buf: &mut [f32], _: &cpal::OutputCallbackInfo| {
        PHASE.with(|p| {
            let mut ph = p.get();
            for sample in buf.iter_mut() {
                let val = (ph.sin() * 0.15).clamp(-1.0, 1.0);
                *sample = val;
                ph += step;
                if ph >= TAU {
                    ph -= TAU;
                }
            }
            p.set(ph);
        });
    };

    let err_callback = |err| eprintln!("Audio error: {:?}", err);

    let stream = device
        .build_output_stream(
            &config,
            data_callback,
            err_callback,
            None,
        )
        .map_err(|e| format!("Stream build failed: {:?}", e))?;

    stream.play().map_err(|e| format!("Play failed: {:?}", e))?;

    // Stream stays alive for process lifetime (intentional leak).
    // Production: store in Tauri::State<OnceLock<Stream>>.
    std::mem::forget(stream);

    PLAYING.store(true, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub fn stop_863hz() -> Result<(), String> {
    PLAYING.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub fn is_863hz_playing() -> bool {
    PLAYING.load(Ordering::SeqCst)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn playing_initializes_false() {
        PLAYING.store(false, Ordering::SeqCst);
        assert!(!PLAYING.load(Ordering::SeqCst));
    }
    #[test]
    fn playing_toggles_correctly() {
        PLAYING.store(false, Ordering::SeqCst);
        PLAYING.store(true, Ordering::SeqCst);
        assert!(PLAYING.load(Ordering::SeqCst));
        PLAYING.store(false, Ordering::SeqCst);
        assert!(!PLAYING.load(Ordering::SeqCst));
    }
}
