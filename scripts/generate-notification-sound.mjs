import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Crear archivo WAV con un tono fuerte de notificación
function generateWavFile(filename) {
  // Parámetros de audio
  const sampleRate = 44100; // Hz
  const duration = 2; // segundos
  const frequency1 = 800; // Hz - tono base fuerte
  const frequency2 = 1200; // Hz - tono agudo para efecto
  const volume = 0.9; // 90% del máximo para que sea fuerte

  const samples = sampleRate * duration;
  const channels = 1; // mono
  const bytesPerSample = 2; // 16-bit
  const blockAlign = channels * bytesPerSample;

  // Crear buffer para samples
  const audioData = Buffer.alloc(samples * blockAlign);

  // Generar tono con modulación (sonido más interesante y fuerte)
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    
    // Crear efecto de dos tonos intercalados para notificación urgente
    let sample;
    if (t < 0.5) {
      // Primera mitad: tono base
      sample = Math.sin(2 * Math.PI * frequency1 * t);
    } else if (t < 1.0) {
      // Segunda mitad: tono agudo
      sample = Math.sin(2 * Math.PI * frequency2 * (t - 0.5));
    } else if (t < 1.5) {
      // Tercera sección: combinación
      sample = (Math.sin(2 * Math.PI * frequency1 * (t - 1.0)) + 
                Math.sin(2 * Math.PI * frequency2 * (t - 1.0))) / 2;
    } else {
      // Última sección: tono base otra vez
      sample = Math.sin(2 * Math.PI * frequency1 * (t - 1.5));
    }

    // Aplicar envolvente ADSR simplificado para suavizar el sonido
    let envelope = 1.0;
    if (t < 0.1) envelope = t / 0.1; // Attack
    else if (t > 1.8) envelope = (duration - t) / 0.2; // Release

    sample = sample * envelope * volume;

    // Convertir a 16-bit signed
    const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    audioData.writeInt16LE(intSample, i * 2);
  }

  // Crear header WAV
  const header = Buffer.alloc(44);
  const dataSize = audioData.length;
  const fileSize = 36 + dataSize;

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Sub-chunk size
  header.writeUInt16LE(1, 20); // Audio format (1 = PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28); // Byte rate
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34); // Bits per sample

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  // Combinar y escribir archivo
  const wavFile = Buffer.concat([header, audioData]);
  fs.writeFileSync(filename, wavFile);
  console.log(`✓ Archivo de audio creado: ${filename}`);
}

// Crear directorio si no existe
const soundsDir = path.join(__dirname, '../frontend/public/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Generar archivo
const audioPath = path.join(soundsDir, 'notification-alert.wav');
generateWavFile(audioPath);
console.log(`Audio guardado en: ${audioPath}`);
