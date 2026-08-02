import { Test, TestingModule } from '@nestjs/testing';
import { CliController } from '@/modules/cli/cli.controller';
import { CliService } from '@/modules/cli/cli.service';

describe('CliController', () => {
  let controller: CliController;
  let service: CliService;

  const mockService = {
    getCliTools: jest.fn(),
    createCustomCli: jest.fn(),
    updateCustomCli: jest.fn(),
    deleteCustomCli: jest.fn(),
    upsertCliOverride: jest.fn(),
    deleteCliOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CliController],
      providers: [{ provide: CliService, useValue: mockService }],
    }).compile();

    controller = module.get<CliController>(CliController);
    service = module.get<CliService>(CliService);
    jest.clearAllMocks();
  });

  it('should list CLI tools', async () => {
    const mockData = { customClis: [], builtinOverrides: [] };
    mockService.getCliTools.mockResolvedValue(mockData);

    const req = { user: { id: 'u1' } } as any;
    const res = await controller.getCliTools(req);
    expect(res).toEqual(mockData);
    expect(mockService.getCliTools).toHaveBeenCalledWith('u1');
  });
});
