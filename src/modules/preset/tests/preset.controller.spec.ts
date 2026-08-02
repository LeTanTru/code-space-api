import { Test, TestingModule } from '@nestjs/testing';
import { PresetController } from '@/modules/preset/preset.controller';
import { PresetService } from '@/modules/preset/preset.service';

describe('PresetController', () => {
  let controller: PresetController;
  let service: PresetService;

  const mockService = {
    getPresets: jest.fn(),
    getPresetById: jest.fn(),
    createPreset: jest.fn(),
    updatePreset: jest.fn(),
    deletePreset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PresetController],
      providers: [{ provide: PresetService, useValue: mockService }],
    }).compile();

    controller = module.get<PresetController>(PresetController);
    service = module.get<PresetService>(PresetService);
    jest.clearAllMocks();
  });

  it('should list presets', async () => {
    const mockList = [
      {
        id: 'p_1',
        userId: 'u_1',
        name: 'Preset 1',
        count: 2,
        createdAt: 100,
        updatedAt: 200,
      },
    ];
    mockService.getPresets.mockResolvedValue(mockList);

    const req = { user: { id: 'u_1' } } as any;
    const res = await controller.getPresets(req);
    expect(res).toEqual(mockList);
    expect(mockService.getPresets).toHaveBeenCalledWith('u_1');
  });
});
