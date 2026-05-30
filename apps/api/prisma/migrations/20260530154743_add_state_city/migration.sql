-- CreateTable
CREATE TABLE "State" (
    "uf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "State_pkey" PRIMARY KEY ("uf")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "ibgeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateUf" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "State_name_idx" ON "State"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_ibgeCode_key" ON "City"("ibgeCode");

-- CreateIndex
CREATE INDEX "City_stateUf_idx" ON "City"("stateUf");

-- CreateIndex
CREATE INDEX "City_name_idx" ON "City"("name");

-- CreateIndex
CREATE INDEX "City_stateUf_name_idx" ON "City"("stateUf", "name");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_stateUf_fkey" FOREIGN KEY ("stateUf") REFERENCES "State"("uf") ON DELETE RESTRICT ON UPDATE CASCADE;
