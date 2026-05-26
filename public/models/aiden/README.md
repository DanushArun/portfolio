# AIDEN Observatory Model

`aiden-observatory.glb` is the first physics-informed model for the AIDEN phase.

Concept: a gravitational-lensing analysis instrument that turns MIRA call
signals into visible inspection and evaluation.

Important named nodes:

- `aiden_lensing_analysis_instrument` - root object
- `lens_mass` - asymmetric foreground mass that bends the call signal
- `dark_listening_aperture` - central inspection aperture
- `arc_agent_primary` / `arc_agent_duplicate` - lensed agent-speech arcs
- `arc_customer_primary` / `arc_customer_duplicate` - lensed customer arcs
- `detector_vane_01` through `detector_vane_08` - SOP evaluation fins
- `spectral_slit_01` through `spectral_slit_14` - classification slits
- `interferometer_arm_01` through `interferometer_arm_04` - resolution arms
- `surface_analysis_fibers` - rough surface/fiber silhouette detail

Regenerate with:

```bash
node scripts/create-aiden-model.mjs
```
