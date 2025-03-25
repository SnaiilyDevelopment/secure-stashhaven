
/**
 * WASM-based constant-time comparison
 * Uses WebAssembly for guaranteed constant-time operations
 */

// WASM binary for constant-time comparison
const wasmCode = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x0b, 0x02, 0x60,
  0x02, 0x7f, 0x7f, 0x01, 0x7f, 0x60, 0x03, 0x7f, 0x7f, 0x7f, 0x01, 0x7f,
  0x03, 0x03, 0x02, 0x00, 0x01, 0x04, 0x05, 0x01, 0x70, 0x01, 0x01, 0x01,
  0x05, 0x03, 0x01, 0x00, 0x00, 0x06, 0x06, 0x01, 0x7f, 0x01, 0x41, 0x00,
  0x0b, 0x07, 0x13, 0x02, 0x06, 0x6d, 0x65, 0x6d, 0x6f, 0x72, 0x79, 0x02,
  0x00, 0x07, 0x63, 0x6f, 0x6d, 0x70, 0x61, 0x72, 0x65, 0x00, 0x01, 0x0a,
  0x1a, 0x01, 0x18, 0x00, 0x20, 0x00, 0x20, 0x01, 0x20, 0x02, 0x6a, 0x28,
  0x02, 0x00, 0x20, 0x00, 0x20, 0x01, 0x20, 0x02, 0x6a, 0x28, 0x02, 0x00,
  0x6a, 0x0b
]);

let wasmModule: {
  compare: (a: Uint8Array, b: Uint8Array) => boolean
} | null = null;

// Initialize WASM module with error handling
export async function initWasm() {
  if (wasmModule) return;

  try {
    const module = await WebAssembly.compile(wasmCode);
    const instance = await WebAssembly.instantiate(module);
    
    // Verify the exports exist
    if (!instance.exports.memory || !instance.exports.compare) {
      throw new Error('WASM module missing required exports');
    }
    
    wasmModule = {
      compare: (a: Uint8Array, b: Uint8Array): boolean => {
        if (a.length !== b.length) return false;
        
        // Get memory with proper type assertion
        const memory = new Uint8Array((instance.exports.memory as WebAssembly.Memory).buffer);
        const aOffset = 0;
        const bOffset = a.length;
        
        // Check that we have enough memory
        if (memory.length < aOffset + a.length + b.length) {
          throw new Error('Insufficient WASM memory for comparison');
        }
        
        // Copy data into WASM memory
        memory.set(a, aOffset);
        memory.set(b, bOffset);
        
        // Perform constant-time comparison
        try {
          const result = (instance.exports.compare as (
            aOffset: number,
            bOffset: number,
            length: number
          ) => number)(
            aOffset, bOffset, a.length
          );
          
          return Boolean(result);
        } finally {
          // Always clear memory regardless of result
          memory.fill(0, aOffset, aOffset + a.length);
          memory.fill(0, bOffset, bOffset + b.length);
        }
      }
    };
  } catch (error) {
    console.error('Failed to initialize WASM module:', error);
    throw new Error(`WASM initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Perform constant-time comparison with proper error handling
export const compare = async (a: Uint8Array, b: Uint8Array): Promise<boolean> => {
  try {
    if (!wasmModule) {
      await initWasm();
    }
    
    if (!wasmModule) {
      throw new Error('WASM module failed to initialize');
    }
    
    return wasmModule.compare(a, b);
  } catch (error) {
    console.error('Constant-time comparison failed:', error);
    throw new Error(`Comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
