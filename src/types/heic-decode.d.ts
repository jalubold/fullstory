declare module 'heic-decode' {
  function decode(options: { buffer: Buffer | Uint8Array | ArrayBuffer }): Promise<{ width: number; height: number; data: Uint8ClampedArray }>;
  export default decode;
}
