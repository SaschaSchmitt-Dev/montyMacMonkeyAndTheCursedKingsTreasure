/** Combines category mappings without changing the asset paths used by the game. */
// Edit the matching category in image-mappings/ when adding or replacing images.
const optimizedImagePaths = {
    ...characterImageMappings.optimized,
    ...enemyImageMappings.optimized,
    ...bossImageMappings.optimized,
    ...level1ImageMappings.optimized,
    ...itemImageMappings.optimized,
    ...projectileImageMappings.optimized,
    ...interfaceImageMappings.optimized,
};
