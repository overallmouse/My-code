const model_url = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';
let mic;
let pitch;
let audioContext;

let gestorAmp;
let gestorPitch;
let monitorear = false;
let umbral_sonido = 0.1;
let antesHabiaSonido;
let shapes = []; // Arreglo para almacenar las formas

let gridSize = 100; // Tamaño de cada zona en la cuadrícula
let grid = []; // Arreglo para almacenar el estado de cada zona

function setup() {
  createCanvas(650, 650);
  background(0);

  // Inicializo la escucha de sonido
  audioContext = getAudioContext();
  mic = new p5.AudioIn();
  mic.start(startPitch);

  // Agregar esto
  userStartAudio();

  // Inicializo los objetos de gestión de señal
  gestorAmp = new GestorSenial(0.0, 0.8);
  gestorPitch = new GestorSenial(55, 65);
  gestorPitch.dibujarDerivada = true;

  // Inicializo la cuadrícula
  let cols = ceil(width / gridSize);
  let rows = ceil(height / gridSize);
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = false; // Zona no ocupada
    }
  }

  antesHabiaSonido = false;
}

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  // Verifica si los rectángulos se solapan
  return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
}

// Función para verificar colisión con las formas existentes
function checkShapeCollision(x, y, w, h) {
  for (let i = 0; i < shapes.length; i++) {
    let existingShape = shapes[i];
    if (checkCollision(x, y, w, h, existingShape.x, existingShape.y, existingShape.w, existingShape.h)) {
      return true; // Hay colisión
    }
  }
  return false; // No hay colisión
}

function draw() {
  let vol = mic.getLevel();
  gestorAmp.actualizar(vol);

  let haySonido = gestorAmp.filtrada > umbral_sonido;

  let empezoElSonido = haySonido && !antesHabiaSonido;
  let terminoElSonido = !haySonido && antesHabiaSonido;

  if (empezoElSonido) {
    /// aca hacer algo ante el evento empezo el sonido
  }

  if (haySonido && frameCount % 3 == 0) {
    for (let i = 0; i < 1; i++) {
      let x = map(gestorPitch.filtrada, 0.2, 0.8, 0, width);
      let y = random(height);
      let size = random(20, 100);
      let shapeType = random(['rect', 'denseRect', 'borderRect', 'gridRect', 'line', 'dottedLine', 'custom1', 'custom2']);
      let spacing = random(5, 20);
  
      // Verifica si hay colisión antes de agregar la forma
      if (!checkShapeCollision(x, y, size, size)) {
        let newShape = new Shape(x, y, size, size, shapeType, spacing);
        shapes.push(newShape);
      }
    }
  }

  // Dibujar todas las formas en el arreglo
  for (let i = 0; i < shapes.length; i++) {
    shapes[i].display();
  }
  if (monitorear) {
    gestorAmp.dibujar(100, 100);
    gestorPitch.dibujar(100, 300);
  }

  antesHabiaSonido = haySonido;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function startPitch() {
  pitch = ml5.pitchDetection(model_url, audioContext, mic.stream, modelLoaded);
}

function modelLoaded() {
  getPitch();
}

function getPitch() {
  pitch.getPitch(function (err, frequency) {
    if (frequency) {
      let midiNum = freqToMidi(frequency);
      gestorPitch.actualizar(midiNum);
    }
    getPitch();
  });
}

class Shape {
  constructor(x, y, w, h, shapeType, spacing) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.shapeType = shapeType;
    this.spacing = spacing;
    this.orientation = random(['horizontal', 'vertical']);
    this.noiseScale = 0.005; // Escala del Perlin noise
    this.spacingNoiseScale = 0.01; // Escala del Perlin noise para el espaciado
  }

  display() {
    stroke(255);
    strokeWeight(random(1, 2));

    // Dibujar la forma según el tipo
    if (this.shapeType === 'rect') {
      for (let i = 0; i < this.w; i += this.spacing) {
        for (let j = 0; j < this.h; j += this.spacing) {
          let ruidoH = map(noise((this.x + i) * this.noiseScale, (this.y + j) * this.noiseScale), 0, 1, -10, 10);
          let spacingNoise = map(noise((i + this.x) * this.spacingNoiseScale, (j + this.y) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
          point(this.x + i + ruidoH, this.y + j + spacingNoise);
        }
      }
    } else if (this.shapeType === 'denseRect') {
      for (let i = 0; i < this.w; i += this.spacing) {
        for (let j = 0; j < this.h; j += this.spacing) {
          let ruidoH = map(noise((this.x + i) * this.noiseScale, (this.y + j) * this.noiseScale), 0, 1, -10, 10);
          let spacingNoise = map(noise((i + this.x) * this.spacingNoiseScale, (j + this.y) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
          point(this.x + i + ruidoH, this.y + j + spacingNoise);
        }
      }
    } else if (this.shapeType === 'borderRect') {
      for (let i = 0; i < this.w; i += this.spacing) {
        let ruidoH = map(noise((this.x + i) * this.noiseScale), 0, 1, -10, 10);
        let spacingNoise = map(noise((i + this.x) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
        point(this.x + i + ruidoH, this.y);
        point(this.x + i + ruidoH, this.y + this.h - spacingNoise);
      }
      for (let j = 0; j < this.h; j += this.spacing) {
        let ruidoV = map(noise((this.y + j) * this.noiseScale), 0, 1, -10, 10);
        let spacingNoise = map(noise((j + this.y) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
        point(this.x, this.y + j + ruidoV);
        point(this.x + this.w - spacingNoise, this.y + j + ruidoV);
      }
    } else if (this.shapeType === 'gridRect') {
      for (let i = 0; i < this.w; i += this.spacing) {
        for (let j = 0; j < this.h; j += this.spacing) {
          if ((i / this.spacing) % 2 === (j / this.spacing) % 2) {
            let ruidoH = map(noise((this.x + i) * this.noiseScale), 0, 1, -10, 10);
            let ruidoV = map(noise((this.y + j) * this.noiseScale), 0, 1, -10, 10);
            let spacingNoiseH = map(noise((i + this.x) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
            let spacingNoiseV = map(noise((j + this.y) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
            point(this.x + i + ruidoH + spacingNoiseH, this.y + j + ruidoV + spacingNoiseV);
          }
        }
      }
    } else if (this.shapeType === 'line') {
      if (this.orientation === 'horizontal') {
        for (let i = 0; i < this.w; i += this.spacing) {
          let ruidoH = map(noise((this.x + i) * this.noiseScale), 0, 1, -10, 10);
          let spacingNoise = map(noise((i + this.x) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
          point(this.x + i + ruidoH, this.y + spacingNoise);
        }
      } else {
        for (let i = 0; i < this.h; i += this.spacing) {
          let ruidoV = map(noise((this.y + i) * this.noiseScale), 0, 1, -10, 10);
          let spacingNoise = map(noise((i + this.y) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
          point(this.x + spacingNoise, this.y + i + ruidoV);
        }
      }
    } else if (this.shapeType === 'dottedLine') {
      if (this.orientation === 'horizontal') {
        for (let i = 0; i < this.w; i += this.spacing) {
          let ruidoH = map(noise((this.x + i) * this.noiseScale), 0, 1, -10, 10);
          let spacingNoise = map(noise((i + this.x) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
          point(this.x + i + ruidoH, this.y + spacingNoise);
        }
      } else {
        for (let i = 0; i < this.h; i += this.spacing) {
          let ruidoV = map(noise((this.y + i) * this.noiseScale), 0, 1, -10, 10);
          let spacingNoise = map(noise((i + this.y) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
          point(this.x + spacingNoise, this.y + i + ruidoV);
        }
      }
    } else if (this.shapeType === 'custom1') {
      for (let i = 0; i < 13; i++) {
        for (let i = 0; i < 13; i++) {
          for (let j = 0; j < 7; j++) {
            if (i < 2 || i > 10 || j < 2 || j > 4) {
              let ruidoH = map(noise((this.x + i * this.spacing) * this.noiseScale, (this.y + j * this.spacing) * this.noiseScale), 0, 1, -10, 10);
              let spacingNoise = map(noise((i + this.x) * this.spacingNoiseScale, (j + this.y) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
              point(this.x + i * this.spacing + ruidoH, this.y + j * this.spacing + spacingNoise);
            }
          }
        }
      }
    } else if (this.shapeType === 'custom2') {
      let rectWidth = 2 * this.spacing;
      let rectHeight = 4 * this.spacing;
      let separation = this.spacing * 1.5;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          for (let i = 0; i < rectWidth; i += this.spacing) {
            for (let j = 0; j < rectHeight; j += this.spacing) {
              let ruidoH = map(noise((this.x + col * (rectWidth + separation) + i) * this.noiseScale, (this.y + row * (rectHeight + separation) + j) * this.noiseScale), 0, 1, -10, 10);
              let ruidoV = map(noise((this.x + col * (rectWidth + separation) + i) * this.noiseScale, (this.y + row * (rectHeight + separation) + j) * this.noiseScale), 0, 1, -10, 10);
              let spacingNoiseH = map(noise((i + this.x) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
              let spacingNoiseV = map(noise((j + this.y) * this.spacingNoiseScale), 0, 1, this.spacing - 5, this.spacing + 5);
              point(this.x + col * (rectWidth + separation) + i + ruidoH + spacingNoiseH, this.y + row * (rectHeight + separation) + j + ruidoV + spacingNoiseV);
            }
          }
        }
      }
    }
  }
}





