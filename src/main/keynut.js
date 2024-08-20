import {
  mouse,
  screen,
  sleep,
  useConsoleLogger,
  ConsoleLogLevel,
  Point,
  keyboard,
  Key,
  clipboard,
} from "@nut-tree-fork/nut-js";
class MouseController {
  constructor() {
    this.currentPosition = { x: 0, y: 0 };
  }

  async updatePosition() {
    this.currentPosition = await mouse.getPosition();
  }

  async moveUp(distance = 10) {
    await this.updatePosition();
    await mouse.setPosition({
      x: this.currentPosition.x,
      y: this.currentPosition.y - distance,
    });
  }

  async moveDown(distance = 10) {
    await this.updatePosition();
    await mouse.setPosition({
      x: this.currentPosition.x,
      y: this.currentPosition.y + distance,
    });
  }

  async moveLeft(distance = 10) {
    await this.updatePosition();
    await mouse.setPosition({
      x: this.currentPosition.x - distance,
      y: this.currentPosition.y,
    });
  }

  async moveRight(distance = 10) {
    await this.updatePosition();
    await mouse.setPosition({
      x: this.currentPosition.x + distance,
      y: this.currentPosition.y,
    });
  }
}
function getKeyboardControlsAsJSONKey(filterType = "string") {
  const keyboardControls = Key;
  const filteredControls = {};

  for (const [key, value] of Object.entries(keyboardControls)) {
    if (
      (filterType === "string" && typeof value === "string") ||
      (filterType === "number" && typeof value === "number")
    ) {
      filteredControls[key] = value;
    }
  }

  return JSON.stringify(filteredControls, null, 2);
}
// console.log(Key);
const mouseController = new MouseController();
// useConsoleLogger({ logLevel: ConsoleLogLevel.DEBUG });

class KeyboardController {
  constructor() {
    this.keyboardmap = Key;
  }

  async pressKeys(keys) {
    await keyboard.pressKey(...keys);
  }

  async releaseKeys(keys) {
    await keyboard.releaseKey(...keys);
  }

  async type(text) {
    await keyboard.type(text);
  }

  async parseAndExecuteKeyCommand(command) {
    let keys = [];
    console.log("parseAndExecuteKeyCommand", command);

    if (Array.isArray(command)) {
      keys = command;
    } else if (typeof command === "number") {
      keys = [command];
    } else {
      console.warn("Tipo de comando no válido");
      return;
    }

    try {
      // Convertir nombres de teclas a códigos de teclas
      const keyCodes = keys
        .map((key) => {
          if (typeof key === "string") {
            return Key[key] || null;
          } else if (typeof key === "number") {
            // Verificar si el código de tecla es válido
            return Object.values(Key).includes(key) ? key : null;
          } else {
            console.warn(`Tecla no reconocida: ${key}`);
            return null;
          }
        })
        .filter((code) => code !== null);

      if (keyCodes.length === 0) {
        console.warn("No se encontraron teclas válidas para ejecutar");
        return;
      }

      // Presionar todas las teclas
      for (const keyCode of keyCodes) {
        await keyboard.pressKey(keyCode);
      }

      // Pequeña pausa para asegurar que las teclas se presionen correctamente
      await sleep(50);

      // Liberar todas las teclas en orden inverso
      for (let i = keyCodes.length - 1; i >= 0; i--) {
        await keyboard.releaseKey(keyCodes[i]);
      }

      console.log(`Executed key command: ${keyCodes.join("+")}`);
    } catch (error) {
      console.error("Error al ejecutar el comando de teclado:", error);
    }
  }

  findKeyboardControl(key) {
    const keyUpperCase = key.toUpperCase();
    for (const [k, v] of Object.entries(this.keyboardmap)) {
      if (v.toUpperCase() === keyUpperCase) {
        return Key[k];
      }
    }
    return null;
  }
}

const keyboardController = new KeyboardController();
export default {
  mouseController,
  getKeyboardControlsAsJSONKey,
  keyboardController,
};
// module.exports = { mouseController, getKeyboardControlsAsJSONKey, keyboardController };
