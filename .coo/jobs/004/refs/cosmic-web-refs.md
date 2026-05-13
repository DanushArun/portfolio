# Cosmic Web / Virgo Supercluster — Visual References

These references inform the palette, filament structure, knot appearance, and
observational photographic style required by AC1 and the quality-bar storyboard.
Listed roughly from most to least directly applicable.

---

## REF-CW-01 — ESA Planck + ROSAT: Shapley Supercluster core (2013)

**URL:** https://www.esa.int/ESA_Multimedia/Images/2013/10/Shapley_Supercluster  
**Also at:** https://sci.esa.int/web/planck/-/57952-shapley-supercluster  
**License / Credit:** ESA & Planck Collaboration / ROSAT / Digitised Sky Survey  
(ESA Planck imagery is free for educational/non-commercial use with attribution.
No CC license is formally stated on this image; treat as inspiration-only for
direct inclusion. The visual language it establishes — blue SZ gas, pink X-ray
cluster hotspots — is fair to replicate stylistically.)  
**Date:** 21 October 2013 / Planck Collaboration paper March 2013  
**What it shows:** The canonical "blue diffuse gas + red X-ray hotspot clusters"
composite that the spec cites directly. Planck Sunyaev-Zel'dovich effect = blue;
ROSAT X-ray cluster emission = pink. Exactly 2 dominant galaxy clusters (A3558
and A3562) bridged by a detected filament of hot gas. Asymmetric web structure —
not a symmetric blob.

**Why it informs our render:**  
- Palette source: cool blue/cyan gas against warm pink/orange cluster cores.
  Our render inverts slightly (warm white/orange cores against purple-blue web)
  but the same cool/warm contrast principle applies.
- Structural model: the supercluster is NOT uniform gas. There are two dominant
  bright nodes bridged by a thread. Map this to our 5-knot layout.
- The gas cloud has an irregular, asymmetric boundary — not spherical.
  Use Perlin-sculpted density falloff, not a radial gradient.
- The bridge between A3558 and A3562 is the structural precedent for our
  filament system connecting knots.

---

## REF-CW-02 — ESA/Hubble Cosmic Web Artist's Impression (2020)

**URL:** https://esahubble.org/images/heic2003b/  
**Also at:** https://science.nasa.gov/image-detail/the-cosmic-web-artists-impression/  
**License:** Creative Commons Attribution 4.0 International (CC BY 4.0)  
**Credit:** Volker Springel (Max Planck Institute for Astrophysics) et al.  
**Date:** 10 March 2020  
**What it shows:** Artist's impression of the large-scale cosmic web: filaments of
luminous matter tracing vast cobweb-like structure. Fine thread-like strands running
across the frame. Nodes at filament intersections. Deep black background. High-contrast
rendering where filaments glow against the void.

**Why it informs our render:**  
- This is the direct model for the "photographic Hubble/Planck-style" look the
  spec requires. Our render should pass the "could this be from the same image set"
  test against this reference.
- Filament geometry: thin threads with luminous cores, broader diffuse halo around
  each thread. Our tube-of-sprites approach for filaments should match this profile.
- The web is sparse — lots of dark void between filaments. Don't over-populate
  the gas cloud; the emptiness is part of the look.
- Brightness variation along a single filament: filaments are not uniform. They
  brighten near nodes. Drive per-vertex alpha by proximity to KNOT_TABLE positions.

---

## REF-CW-03 — IllustrisTNG Large-Scale Structure TNG300 slice (2018–present)

**URL:** https://www.tng-project.org/media/  
**License:** Available for educational/journalistic use with attribution
"IllustrisTNG Collaboration / TNG Project." No formal CC license specified on the
media page; treat as inspiration-only for production use.  
**Date:** Simulation data released 2018; media page updated continuously.  
**What it shows:** Thin slice through the TNG300 simulation at z=0. Colour
encodes projected baryonic mass density (brightness) and mean gas temperature
(hue). Low-density voids: black. Cosmic filaments: yellow/green. Gas halos
around clusters: light blue. Individual galaxies: white hotspots.

**Why it informs our render:**  
- The colour-coding here is a useful secondary palette: the gas in filaments is
  warm (yellow-green) while voids are cold/dark. Our spec inverts this to
  blue/purple filaments with warm orange cores — but the "cores are hotter /
  brighter than filaments" principle is consistent with simulation reality.
- Internal filament structure: the TNG300 slice shows that filaments are not
  single threads but have internal sub-structure — a bright spine with diffuse
  wings. Our tube-of-sprites should replicate this (dense central row, sparse
  outer rows).
- Void spacing: there is at least as much empty space as populated filament.

---

## REF-CW-04 — ESA XMM-Newton Cosmic Filaments Exposed (eROSITA / XMM)

**URL:** https://www.esa.int/Science_Exploration/Space_Science/Cosmic_filaments_exposed_near_huge_cluster  
**License:** ESA/XMM-Newton attribution required; no CC license stated.
Inspiration-only for production.  
**What it shows:** Three massive filaments of hot gas (X-ray) flowing into the
galaxy cluster Abell 2744 "Pandora's Box." The filaments are narrow, elongated,
bright at their ends where they enter the cluster, and diffuse mid-span.

**Why it informs our render:**  
- Filament termination at knot: in X-ray observation, filaments get brighter and
  thicker as they approach the cluster core. Our tube sprites should increase in
  density / alpha in the ~20% of their length nearest the knot positions.
- Filament aspect ratio: real filaments are very elongated — 5–10× longer than wide.
  Our Bezier-path filaments should have tight cross-sections relative to their length.

---

## REF-CW-05 — IllustrisTNG Dark Matter + Gas Density Overlay (2018)

**URL:** https://www.tng-project.org/media/ (see "Large-scale projection" dark
matter density overlaid with gas velocity field)  
**License:** Inspiration-only (same as REF-CW-03).  
**What it shows:** Large-scale projection centred on the most massive cluster.
Dark matter density (orange/yellow threads) with gas velocity arrows. The
interplay of dark matter web and gas velocity shows how material flows along
filaments toward cluster nodes.

**Why it informs our render:**  
- The "data flow" visual we need for the plume is literally what this image shows:
  material streaming along filament axes toward clusters. The plume's outward and
  return trajectory should look like it's following these natural flow lines.
- The dark matter web at large scale has a foam/sponge topology: nodes connected
  by multiple distinct filaments, not a single ring. Position our 5 knots so
  multiple filament paths between them are plausible.

---

## REF-CW-06 — Illustris-1 Dark Matter Density Distribution (animated projection)

**URL:** https://www.illustris-project.org/media/  
**License:** Inspiration-only (see REF-CW-03 note).  
**What it shows:** Animated slice through the full Illustris-1 box at redshift
zero. Three-dimensional filament web revealed as the slice plane moves. Void
cells clearly separated from overdense filaments. Strong dynamic range.

**Why it informs our render:**  
- The 3D layering: filaments at different depths are visible in projection as
  brighter/dimmer threads. Our gas cloud should use multiple particle layers at
  different z-depths with additive blending to produce this depth impression in
  a static 2D projection view.
- Colour contrast: pure white filament cores, blue/purple halo, black void.
  Our `blue → cyan` additive particle system with white cores near knots
  matches this pattern.
