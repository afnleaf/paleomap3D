<|user|>
is tehre a way for me to call wasm-pack for a module inside a folder/ specificallt inside wasm_modules/ but stay in this cwd?
<|end|>
<|assistant|>
Yes, `wasm-pack build` accepts a path argument:

```
wasm-pack build wasm_modules --target web
```

Or with more options:
```
wasm-pack build wasm_modules --target web --out-dir ../pkg --release
```

The path is the directory containing the `Cargo.toml`. All flags (`--target`, `--out-dir`, `--release`, etc.) work the same as when run from inside the folder. Note that `--out-dir` is resolved relative to the crate directory, not your cwd.
<|end|>
