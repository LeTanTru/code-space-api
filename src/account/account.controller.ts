import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AccountService } from './account.service';
import { DeleteAccountDto } from '@/auth/dto/delete-account.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SessionResponseDto, UserMeResponseDto } from '@/auth/dto/auth-response.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@ApiTags('Account')
@Controller('account')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  @ResponseMessage('Get account profile successfully')
  @ApiOperation({
    summary: 'Get User Profile',
    description:
      'Fetches profile metadata for the authenticated user alongside their active logged-in device sessions list.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user profile and active device sessions.',
    type: UserMeResponseDto,
  })
  async getProfile(@Req() req: any): Promise<UserMeResponseDto> {
    return this.accountService.getProfile(req.user.id);
  }

  @Put('profile')
  @Patch('profile')
  @ResponseMessage('Update account profile successfully')
  @ApiOperation({
    summary: 'Update User Profile',
    description:
      'Updates profile metadata (display name and/or avatar URL) for the authenticated user.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Account profile updated successfully.',
    type: UserMeResponseDto,
  })
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: any): Promise<UserMeResponseDto> {
    return this.accountService.updateProfile(req.user.id, dto);
  }

  @Get(['session', 'session/list'])
  @ResponseMessage('Get list of active sessions successfully')
  @ApiOperation({
    summary: 'List Active Logged-In Sessions',
    description:
      'Lists all active logged-in device sessions (IP, User Agent, device name, expiration) for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved active sessions list.',
    type: [SessionResponseDto],
  })
  async getSessions(@Req() req: any): Promise<SessionResponseDto[]> {
    return this.accountService.getSessions(req.user.id);
  }

  @Delete('session/delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Delete session successfully')
  @ApiOperation({
    summary: 'Revoke Specific Session',
    description:
      'Revokes a single active session owned by the authenticated user (prevents IDOR by scoping the lookup to the JWT userId).',
  })
  @ApiParam({ name: 'id', description: 'Session ID to revoke', example: '10' })
  @ApiResponse({
    status: 204,
    description: 'Session revoked successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or not owned by the user.',
  })
  async revokeSession(@Param('id') sessionId: string, @Req() req: any): Promise<void> {
    return this.accountService.revokeSession(req.user.id, sessionId);
  }

  @Delete('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Delete account successfully')
  @ApiOperation({
    summary: 'Delete Account',
    description:
      "Permanently deletes the authenticated user's account and all associated data. Requires password confirmation to prevent accidental or unauthorised deletion.",
  })
  @ApiBody({ type: DeleteAccountDto })
  @ApiResponse({
    status: 204,
    description: 'Account permanently deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'Incorrect password or user not found.',
  })
  async deleteAccount(@Body() dto: DeleteAccountDto, @Req() req: any): Promise<void> {
    return this.accountService.deleteAccount(req.user.id, dto.password);
  }

  @Post('change-password')
  @Put('password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Change password successfully')
  @ApiOperation({
    summary: 'Change Password',
    description:
      "Verifies the user's current password and updates it to a new password. Revokes all active refresh sessions to force re-login.",
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Incorrect current password.',
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: any
  ): Promise<{ message: string }> {
    return this.accountService.changePassword(req.user.id, dto);
  }
}
