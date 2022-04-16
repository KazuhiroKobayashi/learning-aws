import * as fs from "fs";

import * as ec2 from "aws-cdk-lib/aws-ec2";

export namespace Settings {
  export const EnvType = {
    Dev: "dev",
    Test: "test",
    Stg: "stg",
    Prod: "prod",
  } as const;
  export const Cluster = "asgcw";
  export const Environment = EnvType.Dev;
  export const Prefix = `${Cluster}-${Environment}`;
  export const Region = "ap-northeast-1";
  export const AZ = {
    a: `${Region}a`,
    c: `${Region}c`,
    d: `${Region}d`,
  } as const;

  // Network
  const commonCidr = "10.0.";
  export const CidrMask = {
    vpc: 16,
    subnet: 24,
  } as const;
  export const VpcCidr = `${commonCidr}0.0/${CidrMask.vpc}`;

  // Application
  const userData = ec2.UserData.forLinux({ shebang: "#!/bin/bash" });
  const script = fs.readFileSync("./lib/asg-cw/lib/userdata.sh", {
    encoding: "utf-8",
  });
  userData.addCommands(...script.split("\n"));
  export const Web = {
    InstanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T4G,
      ec2.InstanceSize.NANO
    ),
    MachineImage: ec2.MachineImage.latestAmazonLinux({
      cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      edition: ec2.AmazonLinuxEdition.STANDARD,
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2022,
      userData,
    }),
  } as const;
}

export namespace Constant {
  export const IPV4_ALL = "0.0.0.0/0";
  export const PORT = {
    HTTP: 80,
    HTTPS: 443,
  } as const;
  export const ROLE_ARN = {
    AmazonSSMManagedInstanceCore:
      "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
  };
}
