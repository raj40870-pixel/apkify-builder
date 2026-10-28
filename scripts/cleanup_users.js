import mongoose from 'mongoose';

const mongoUri = 'mongodb://raj40870:lVjEIl6i2wch8AbX@ac-ekmvanb-shard-00-00.d1qshcp.mongodb.net:27017,ac-ekmvanb-shard-00-01.d1qshcp.mongodb.net:27017,ac-ekmvanb-shard-00-02.d1qshcp.mongodb.net:27017/AppifyNow?ssl=true&replicaSet=atlas-kyyvyz-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  await mongoose.connect(mongoUri);
  const usersColl = mongoose.connection.db.collection('users');
  
  const emailsToDelete = [
    'test_build@gmail.com',
    'test@gmail.com',
    'buildtest_6323@gmail.com',
    'localtest_8879@gmail.com',
    'localtest_6278@gmail.com',
    'raj40870@gamil.com',
    'k69117842@gmail.com'
  ];

  const delRes = await usersColl.deleteMany({ email: { $in: emailsToDelete } });
  console.log('Successfully Deleted Users Count:', delRes.deletedCount);

  // Also clean any OtpRequests
  const otpColl = mongoose.connection.db.collection('otprequests');
  await otpColl.deleteMany({});

  const remainingUsers = await usersColl.find({}).toArray();
  console.log(`--- REMAINING SAFE USERS (${remainingUsers.length}) ---`);
  remainingUsers.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email} (Credits: ${u.credits_remaining})`);
  });

  await mongoose.disconnect();
}

main().catch(console.error);
