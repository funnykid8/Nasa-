# Lunar Landing Analyzer — ONLINE COMPETITION BUILD

A polished, static NASA Space Apps Challenge prototype for interactive lunar landing-site screening.

## What changed for the online build

The previous version could remain blocked while trying to retrieve a 3D asset directly from NASA SVS. This build is designed to **never leave the visitor on an endless loading screen**.

It tries, in order:
1. A community-hosted copy of NASA's published lightweight LRO web model.
2. NASA Scientific Visualization Studio's official lightweight model.
3. A **local 3D lunar visualization** bundled with this project.

The local fallback is a real-time textured and relief-mapped 3D Moon visualization, not a blank screen or a basic placeholder. The UI explicitly labels it as a visualization so it is not confused with the NASA model.

## NASA data foundation

NASA's Scientific Visualization Studio says its 2026 Moon web models are made from imagery and topographic data from NASA's Lunar Reconnaissance Orbiter (LRO) and are intended for web interactives.

Official source:
https://svs.gsfc.nasa.gov/14959/

The project also references NASA LOLA:
https://science.nasa.gov/mission/lro/lola/

And NASA's lunar polar illumination work:
https://pgda.gsfc.nasa.gov/products/69/

## Scientific honesty

This is an educational competition prototype.

- The NASA model, when loaded, is clearly identified as NASA LRO-derived.
- The local visualization fallback is clearly identified as a visualization, not as a NASA model.
- Site score, temperature screen, communications screen, and several solar calculations are prototype/derived estimates.
- These values are **not live NASA telemetry, a certified hazard map, or spacecraft flight-control software**.

## Online publishing

This project is static HTML/CSS/JavaScript and is suitable for GitHub Pages. GitHub Pages can publish a project directly from a repository.

Recommended repository structure:

```text
index.html
app.js
style.css
assets/
  lunar_visualization.jpg
  lunar_relief.jpg
.nojekyll
README.md
```

After uploading these files to a public GitHub repository, enable GitHub Pages from the repository's Settings → Pages.

## Demo flow

1. Open Overview.
2. Wait for the short initialization.
3. Rotate and zoom the Moon.
4. Click a point on the surface.
5. Review the site score.
6. Open Terrain.
7. Open Illumination and change mission date/time.
8. Run the educational descent simulation.
9. Export the site report.
10. Explain the NASA data foundation and the prototype calculations.

## Credits

NASA Goddard Space Flight Center / Scientific Visualization Studio  
NASA Lunar Reconnaissance Orbiter (LRO)  
NASA Lunar Orbiter Laser Altimeter (LOLA)

NASA's 3D model page credits NASA Goddard Space Flight Center, Dan Gallagher (eMITS), Ernie Wright (USRA), Tuomas Kankola, Josh Klint, and Aaron E. Lepsch.
