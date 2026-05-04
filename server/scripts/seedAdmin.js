import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('Seed: ADMIN_EMAIL və ya ADMIN_PASSWORD .env faylında tapılmadı. Admin yaratma atlanır.');
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log(`Seed: Admin artıq mövcuddur (${adminEmail}).`);
      return;
    }

    const admin = new User({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      status: 'active'
    });

    await admin.save();
    console.log(`Seed: Admin yaradıldı (${adminEmail}).`);

  } catch (error) {
    console.error('Seed: Admin yaratma xətası:', error.message);
  }
};

export default seedAdmin;
