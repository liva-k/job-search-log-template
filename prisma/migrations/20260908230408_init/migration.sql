-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "sizeEstimate" TEXT,
    "fundingStage" TEXT,
    "research" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'OTHER',
    "location" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "description" TEXT,
    "postedAt" DATETIME,
    "savedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchScore" INTEGER,
    "matchRationale" TEXT,
    "companyId" TEXT,
    CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "appliedAt" DATETIME,
    "followUpAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CvVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CvVersion_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "location" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "skills" TEXT,
    "experience" TEXT,
    "mustHaves" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Job_url_key" ON "Job"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_key" ON "Application"("jobId");
