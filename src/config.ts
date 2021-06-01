const CONFIGS = {
  region: 'ap-guangzhou',
  description: 'Created by Serverless',
  type: 'event',
  compName: 'multi-scf',
  runtime: 'Nodejs12.16',

  cos: {
    lifecycle: [
      {
        status: 'Enabled',
        id: 'deleteObject',
        expiration: { days: '10' },
        abortIncompleteMultipartUpload: { daysAfterInitiation: '10' },
      },
    ] as {
      id: string;
      status: 'Enabled' | 'Disabled';
      filter?: {
        prefix?: string;
      };
      transition?: {
        days?: number | string;
        storageClass?: string;
      };
      NoncurrentVersionTransition?: {
        noncurrentDays?: number | string;
        storageClass?: number | string;
      };
      expiration?: {
        days?: number | string;
        expiredObjectDeleteMarker?: string;
      };
      abortIncompleteMultipartUpload?: {
        daysAfterInitiation?: number | string;
      };
    }[],
  },
};

export { CONFIGS };
