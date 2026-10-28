import mongoose from 'mongoose';

const mongoUri = 'mongodb://raj40870:lVjEIl6i2wch8AbX@ac-ekmvanb-shard-00-00.d1qshcp.mongodb.net:27017,ac-ekmvanb-shard-00-01.d1qshcp.mongodb.net:27017,ac-ekmvanb-shard-00-02.d1qshcp.mongodb.net:27017/AppifyNow?ssl=true&replicaSet=atlas-kyyvyz-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  await mongoose.connect(mongoUri);
  const usersColl = mongoose.connection.db.collection('users');
  const otpColl = mongoose.connection.db.collection('otprequests');

  const usersCountBefore = await usersColl.countDocuments();
  console.log(`Total users before deletion: ${usersCountBefore}`);

  const userDelRes = await usersColl.deleteMany({});
  console.log(`Deleted ${userDelRes.deletedCount} users from database.`);

  const otpDelRes = await otpColl.deleteMany({});
  console.log(`Deleted ${otpDelRes.deletedCount} OTP requests from database.`);

  const usersCountAfter = await usersColl.countDocuments();
  console.log(`Total users remaining: ${usersCountAfter}`);

  await mongoose.disconnect();
}

main().catch(console.error);
