
import userService from '../services/userService.js';
import authService from '../services/authService.js';

class UserController {
    async getProfile(req, res) {
        try {
            const userId = req.user.userId;
            
            const profile = await userService.getProfile(userId);
            
            res.status(200).json(profile);
        } catch (error) {
            console.error('Get profile error:', error);
            
            if (error.message === 'User not found') {
                return res.status(404).json({ message: 'User not found' });
            }
            
            res.status(500).json({ message: 'Failed to get profile', error: error.message });
        }
    }

    async updatePersonalInfo(req, res) {
        try {
            const userId = req.user.userId;
            const { firstName, lastName, email, phone, address } = req.body;
            
            await userService.updateProfile(userId, {
                firstName,
                lastName,
                email,
                phone,
                address
            });
            
            res.status(200).json({ message: 'Personal information updated successfully' });
        } catch (error) {
            console.error('Update personal info error:', error);
            res.status(500).json({ message: 'Failed to update personal info', error: error.message });
        }
    }

    async updateSecurity(req, res) {
        try {
            const userId = req.user.userId;
            const { currentPassword, newPassword } = req.body;
            
            await authService.changePassword(userId, currentPassword, newPassword);
            
            res.status(200).json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error('Update password error:', error);
            
            if (error.message === 'Invalid current password') {
                return res.status(401).json({ message: 'Invalid current password' });
            }
            
            res.status(500).json({ message: 'Failed to update password', error: error.message });
        }
    }

    async updateNotifications(req, res) {
        try {
            const userId = req.user.userId;
            const { emailNotifications, smsNotifications, billingAlerts, usageAlerts, serviceUpdates, marketingCommunications } = req.body;
            
            await userService.updateNotificationPreferences(userId, {
                emailNotifications,
                smsNotifications,
                billingAlerts,
                usageAlerts,
                serviceUpdates,
                marketingCommunications
            });
            
            res.status(200).json({ message: 'Notification preferences updated successfully' });
        } catch (error) {
            console.error('Update notification preferences error:', error);
            res.status(500).json({ message: 'Failed to update notification preferences', error: error.message });
        }
    }

      async getAllUsers(req, res) {
        try {
          // Fetch all users 
          const users = await UserModel.getAllUsers();
    
          const formattedUsers = users.map(user => ({
            id: user.user_id,
            username: `${user.first_name} ${user.last_name}`,
            email: user.email,
            role: user.role,
            status: user.status || 'Active',
            createdAt: user.created_at
          }));
    
          res.json(formattedUsers);
        } catch (error) {
          console.error('Error fetching users:', error);
          res.status(500).json({
            message: 'Failed to retrieve users',
            error: error.message
          });
        }
      }
    
      async updateUser(req, res) {
        try {
          const userId = req.params.id;
          const { role, status } = req.body;
    
          const updated = await UserModel.updateUserRoleOrStatus(userId, { role, status });
    
          if (updated) {
            res.status(200).json({ message: 'User updated successfully' });
          } else {
            res.status(404).json({ message: 'User not found' });
          }
        } catch (error) {
          console.error('Error updating user:', error);
          res.status(500).json({
            message: 'Failed to update user',
            error: error.message
          });
        }
      }
    
      async deleteUser(req, res) {
        try {
          const userId = req.params.id;
    
          const deleted = await UserModel.deleteUser(userId);
    
          if (deleted) {
            res.status(200).json({ message: 'User deleted successfully' });
          } else {
            res.status(404).json({ message: 'User not found' });
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          res.status(500).json({
            message: 'Failed to delete user',
            error: error.message
          });
        }
      }
    }


export default new UserController();