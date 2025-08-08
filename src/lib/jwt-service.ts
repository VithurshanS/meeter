import { SignJWT } from 'jose';

export interface UserData {
  username: string;
  email: string;
  role: 'TUTOR' | 'STUDENT';
}

export class JWTService {
  private static readonly APP_ID = 'mydeploy1';
  private static readonly APP_SECRET = 'wEoG/Y5keRbH4yrjMe7UxWiBzqO8a8VRqY8cVR4oXro=';
  private static readonly DOMAIN = 'jit.shancloudservice.com';

  /**
   * Generate JWT token for Jitsi meeting
   * @param user User data
   * @param roomName Room name for the meeting
   * @returns Promise<string> JWT token
   */
  public static async generateToken(user: UserData, roomName: string): Promise<string> {
    try {
      const isModerator = user.role === 'TUTOR';
      const nowMillis = Date.now();
      const expMillis = nowMillis + (36000 * 1000); // 10 hours in milliseconds

      // Create secret key from base64 string
      const secretBytes = new TextEncoder().encode(this.APP_SECRET);

      // Build context.user
      const userContext = {
        name: user.username,
        email: user.email
      };

      const context = {
        user: userContext
      };

      // Build JWT token using jose library
      const token = await new SignJWT({
        aud: 'jitsi',
        iss: this.APP_ID,
        sub: this.DOMAIN,
        room: roomName, // Use actual room name instead of "*"
        moderator: isModerator,
        context: context
      })
        .setProtectedHeader({ 
          alg: 'HS256',
          typ: 'JWT'
        })
        .setExpirationTime(Math.floor(expMillis / 1000)) // jose expects seconds
        .sign(secretBytes);

      console.log('Generated Token:', token);
      return token;
    } catch (error) {
      console.error('Error generating JWT token:', error);
      throw new Error('Failed to generate JWT token');
    }
  }

  /**
   * Validate user credentials (mock implementation)
   * In production, this should call your backend API
   */
  public static authenticateUser(email: string, password: string): UserData | null {
    // Mock authentication - replace with actual API call
    const mockUsers: Record<string, { password: string; userData: UserData }> = {
      'tutor@example.com': {
        password: 'tutor123',
        userData: {
          username: 'John Tutor',
          email: 'tutor@example.com',
          role: 'TUTOR'
        }
      },
      'student@example.com': {
        password: 'student123',
        userData: {
          username: 'Jane Student',
          email: 'student@example.com',
          role: 'STUDENT'
        }
      }
    };

    const user = mockUsers[email];
    if (user && user.password === password) {
      return user.userData;
    }

    return null;
  }

  /**
   * Generate token with authentication
   */
  public static async generateTokenWithAuth(
    email: string, 
    password: string, 
    roomName: string
  ): Promise<string | null> {
    const user = this.authenticateUser(email, password);
    if (user) {
      return await this.generateToken(user, roomName);
    }
    return null;
  }
}
