import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
    // stub the underlying client methods
    (service as any).$connect = jest.fn().mockResolvedValue(undefined);
    (service as any).$disconnect = jest.fn().mockResolvedValue(undefined);
  });

  it('onModuleInit calls $connect', async () => {
    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect((service as any).$connect).toHaveBeenCalled();
  });

  it('onModuleInit throws when $connect rejects', async () => {
    (service as any).$connect = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(service.onModuleInit()).rejects.toThrow('fail');
  });

  it('onModuleDestroy calls $disconnect', async () => {
    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    expect((service as any).$disconnect).toHaveBeenCalled();
  });
});
