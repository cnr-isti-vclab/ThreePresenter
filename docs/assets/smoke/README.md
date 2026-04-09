# Smoke Test Assets

This folder contains small assets used by:

- smoke validation (`npm run smoke:assets`)
- lightweight demo pages (`docs/examples/08-obj-textured.html`)

Current bundle:

- `sub.obj`
- `sub.mtl`
- `sub_texture.jpg`

These files are kept together because the OBJ references the MTL, and the MTL references the texture.
