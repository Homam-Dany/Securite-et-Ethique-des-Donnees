export const CERTIFICATE_REGISTRY_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "isAdmin",
        type: "bool"
      }
    ],
    name: "AdminStatusChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "certId",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address"
      },
      {
        indexed: false,
        internalType: "string",
        name: "studentId",
        type: "string"
      },
      {
        indexed: false,
        internalType: "string",
        name: "studentName",
        type: "string"
      },
      {
        indexed: false,
        internalType: "string",
        name: "diplomaTitle",
        type: "string"
      }
    ],
    name: "CertificateMinted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "certId",
        type: "uint256"
      }
    ],
    name: "CertificateRevoked",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "admins",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "recipients",
        type: "address[]"
      },
      {
        internalType: "string[]",
        name: "studentNames",
        type: "string[]"
      },
      {
        internalType: "string[]",
        name: "studentIds",
        type: "string[]"
      },
      {
        internalType: "string[]",
        name: "diplomaTitles",
        type: "string[]"
      },
      {
        internalType: "string[]",
        name: "issueDates",
        type: "string[]"
      },
      {
        internalType: "string[]",
        name: "grades",
        type: "string[]"
      }
    ],
    name: "batchMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "certificateCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "certId",
        type: "uint256"
      }
    ],
    name: "getCertificate",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "studentName",
            type: "string"
          },
          {
            internalType: "string",
            name: "studentId",
            type: "string"
          },
          {
            internalType: "string",
            name: "diplomaTitle",
            type: "string"
          },
          {
            internalType: "string",
            name: "issueDate",
            type: "string"
          },
          {
            internalType: "string",
            name: "grade",
            type: "string"
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address"
          },
          {
            internalType: "bool",
            name: "revoked",
            type: "bool"
          }
        ],
        internalType: "struct CertificateRegistry.Certificate",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getCertificateCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "certId",
        type: "uint256"
      }
    ],
    name: "isCertificateValid",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "studentId",
        type: "string"
      }
    ],
    name: "isStudentRegistered",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        internalType: "string",
        name: "studentName",
        type: "string"
      },
      {
        internalType: "string",
        name: "studentId",
        type: "string"
      },
      {
        internalType: "string",
        name: "diplomaTitle",
        type: "string"
      },
      {
        internalType: "string",
        name: "issueDate",
        type: "string"
      },
      {
        internalType: "string",
        name: "grade",
        type: "string"
      }
    ],
    name: "mintCertificate",
    outputs: [
      {
        internalType: "uint256",
        name: "certId",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "certId",
        type: "uint256"
      }
    ],
    name: "revoke",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        internalType: "bool",
        name: "authorized",
        type: "bool"
      }
    ],
    name: "setAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    name: "studentIdToCertId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

