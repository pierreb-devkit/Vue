import { describe, it, expect, beforeEach } from 'vitest';
import imagesPlugin from '../images';

const api = { protocol: 'http', host: 'localhost', port: '3000' };

describe('images plugin', () => {
  let setImages;

  beforeEach(() => {
    const app = { config: { globalProperties: {} } };
    imagesPlugin.install(app);
    setImages = app.config.globalProperties.setImages;
  });

  it('has an install method', () => {
    expect(typeof imagesPlugin.install).toBe('function');
  });

  it('registers setImages on globalProperties', () => {
    expect(typeof setImages).toBe('function');
  });

  it('returns original file when it has no dot (no extension)', () => {
    expect(setImages(api, 'noextension', null, null)).toBe('noextension');
  });

  it('returns original file when it has more than one dot', () => {
    expect(setImages(api, 'too.many.dots', null, null)).toBe('too.many.dots');
  });

  it('builds URL without size or operation', () => {
    expect(setImages(api, 'photo.jpg', null, null)).toBe('http://localhost:3000/api/uploads/images/photo.jpg');
  });

  it('appends size to filename when provided', () => {
    expect(setImages(api, 'photo.jpg', '200x200', null)).toBe('http://localhost:3000/api/uploads/images/photo-200x200.jpg');
  });

  it('appends operation to filename when provided', () => {
    expect(setImages(api, 'photo.jpg', null, 'crop')).toBe('http://localhost:3000/api/uploads/images/photo-crop.jpg');
  });

  it('appends both size and operation', () => {
    expect(setImages(api, 'photo.jpg', '200x200', 'crop')).toBe('http://localhost:3000/api/uploads/images/photo-200x200-crop.jpg');
  });

  it('preserves extension correctly', () => {
    expect(setImages(api, 'avatar.png', '100', null)).toBe('http://localhost:3000/api/uploads/images/avatar-100.png');
  });
});
