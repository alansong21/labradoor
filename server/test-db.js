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
      role: 'USER'
    }
  });
  console.log('Created user:', { id: user.id, email: user.email });

  // create a post for that user (updatedAt is required by schema)
  const post = await prisma.post.create({
    data: {
      title: 'Hello Prisma',
      published: true,
      updatedAt: new Date(),
      authorId: user.id
    }
  });
  console.log('Created post:', { id: post.id, title: post.title, authorId: post.authorId });

  // query
  const usersWithPosts = await prisma.user.findMany({
    include: { Post: true }
  });
  console.log('Users with posts:', JSON.stringify(usersWithPosts, null, 2));
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });