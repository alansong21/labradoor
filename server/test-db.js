require('dotenv').config({ path: './prisma/.env' }); // adjust path if your .env is elsewhere
const { PrismaClient } = require('./generated/prisma'); // generated client path (per schema.prisma)
const prisma = new PrismaClient();

async function main() {
  console.log('Connected, testing DB...');

  // create a user
  const user = await prisma.user.create({
    data: {
      email: `test+${Date.now()}@example.com`,
      name: 'Test User',
      passwordHash: 'insecure-test-hash',
    },
  });
  console.log('Created user:', { id: user.id, email: user.email });

  // create a researcher record for that user (required by Post.researcherId relation)
  const researcher = await prisma.researcher.create({
    data: {
      userId: user.id,
      verifyStatus: 'VERIFIED',
      department: 'Test Dept',
    },
  });
  console.log('Created researcher:', { userId: researcher.userId });

  // create a post for that researcher
  const post = await prisma.post.create({
    data: {
      title: 'Hello Prisma',
      body: 'This is a test post body',
      researcherId: researcher.userId,
      tags: [],
    },
  });
  console.log('Created post:', { id: post.id, title: post.title, researcherId: post.researcherId });

  // query: fetch posts with researcher
  const posts = await prisma.post.findMany({ include: { researcher: { include: { user: true } } } });
  console.log('Posts with researcher:', JSON.stringify(posts, null, 2));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });