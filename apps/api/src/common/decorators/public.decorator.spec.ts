import { Public, IS_PUBLIC_KEY } from './public.decorator';

describe('Public decorator', () => {
  it('Public returns a decorator function', () => {
    const dec = Public();
    expect(typeof dec).toBe('function');
  });

  it('exports IS_PUBLIC_KEY constant', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});
