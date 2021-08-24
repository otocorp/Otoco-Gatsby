export const CredentialsSchema = {
    title: "Credentials",
    type: "object",
    required: ["_id"],
    properties: {
      _id: {
        type: "string",
        description: "The credential identificator.",
      },
      context: {
        type: "string",
        description: "https://www.w3.org/2018/credentials/v1",
      },
      type: {
        description: "Credential types",
        type: "array",
        items: {
          type: "string"
        },
        minItems: 1,
        uniqueItems: true
      },
      issuer: {
        type: "string",
        description: "Who issued this credential",
      },
      issuanceDate: {
        type: "number",
        description: "When the credential was issued",
      },
      expirationDate: {
        type: "number",
        description: "When this credential expires",
      },
      credentialSubject: {
        type: "object",
        description: "Credential subject"
      },
      proof: {
        type: "object",
        description: "Issuer proofs",
        properties: {
          type: {
            description: "Type of signature used",
            type: "string"
          },
          created: {
            description: "The date signature was created",
            type: "number"
          },
          proofPurpose: {
            description: "The purpose of the proof",
            type: "string"
          },
          verificationMethod: {
            description: "The URI link to instructions to verify credential",
            type: "string"
          },
          proofValue: {
            description: "The signature related to the data",
            type: "string"
          }
        },
      }
    },
  }