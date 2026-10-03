import { IDENTITY_NAMES, AVATAR_SHAPES, AVATAR_COLORS } from '../config/constants.js';

export function generateAnonymousIdentity() {
  const randomIndex = Math.floor(Math.random() * IDENTITY_NAMES.length);
  const name = `Anonymous ${IDENTITY_NAMES[randomIndex]}`;
  const shape = AVATAR_SHAPES[Math.floor(Math.random() * AVATAR_SHAPES.length)];
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const seed = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    displayName: name,
    avatarShape: shape,
    avatarColor: color,
    avatarSeed: seed
  };
}
