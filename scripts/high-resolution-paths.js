/** Combines optional high-resolution variants for large desktop views. */
// Edit the matching category in image-mappings/ when adding or replacing images.
const highResolutionImagePaths = {
    ...characterImageMappings.highResolution,
    ...enemyImageMappings.highResolution,
    ...bossImageMappings.highResolution,
    ...level1ImageMappings.highResolution,
    ...itemImageMappings.highResolution,
    ...projectileImageMappings.highResolution,
    ...interfaceImageMappings.highResolution,
};
