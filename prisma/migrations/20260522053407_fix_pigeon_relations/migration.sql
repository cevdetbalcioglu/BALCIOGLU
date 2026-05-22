-- CreateTable
CREATE TABLE "Pigeon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ringId" TEXT NOT NULL,
    "ringLabel" TEXT NOT NULL,
    "gender" TEXT,
    "performance" TEXT,
    "health" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pigeon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PigeonTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamNo" INTEGER NOT NULL,
    "season" TEXT,
    "motherLabel" TEXT,
    "fatherLabel" TEXT,
    "ringColor" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PigeonTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clutch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "eggDate" TIMESTAMP(3),
    "hatchDate" TIMESTAMP(3),
    "fatherId" TEXT,
    "motherId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clutch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClutchEgg" (
    "id" TEXT NOT NULL,
    "clutchId" TEXT NOT NULL,
    "pigeonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClutchEgg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pigeon_userId_ringId_key" ON "Pigeon"("userId", "ringId");

-- CreateIndex
CREATE UNIQUE INDEX "PigeonTeam_userId_teamNo_key" ON "PigeonTeam"("userId", "teamNo");

-- AddForeignKey
ALTER TABLE "Pigeon" ADD CONSTRAINT "Pigeon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PigeonTeam" ADD CONSTRAINT "PigeonTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clutch" ADD CONSTRAINT "Clutch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clutch" ADD CONSTRAINT "Clutch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "PigeonTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clutch" ADD CONSTRAINT "Clutch_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Pigeon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clutch" ADD CONSTRAINT "Clutch_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Pigeon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClutchEgg" ADD CONSTRAINT "ClutchEgg_clutchId_fkey" FOREIGN KEY ("clutchId") REFERENCES "Clutch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClutchEgg" ADD CONSTRAINT "ClutchEgg_pigeonId_fkey" FOREIGN KEY ("pigeonId") REFERENCES "Pigeon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
