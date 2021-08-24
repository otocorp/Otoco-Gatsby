import React, { FC, Dispatch, useState } from 'react'
import Web3 from 'web3'
import { connect } from 'react-redux'
import { IState } from '../../state/types'
import Web3Integrate from '../../services/web3-integrate'
import { ExclamationTriangle, Diagram2 } from 'react-bootstrap-icons'
import '../dashboard/style.scss'
import { PrivateKey } from '@textile/hub'
import { Credential, CredentialProof, CredentialSubject, CredentialTypes, ProofOfOwnership } from '../../services/textile/types'
import './style.scss'

interface Props {
  account?: string
  network?: string
  privatekey?: PrivateKey
}

const Verifier: FC<Props> = ({
  account,
  network,
  privatekey
}: Props) => {
  const [credentialPath, setPath] = useState<string>('')
  const [credentialLoaded, setLoaded] = useState<boolean>(false)
  const [credential, setCredential] = useState<Credential | undefined>()
  const [proofVerified, setProofVerified] = useState<boolean>(false)

  React.useEffect(() => {
    if (privatekey) {
      
    }
  }, [privatekey])

  const loadCredential = (event:React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0])
  }

  const onReaderLoad = async (event:ProgressEvent<FileReader>) => {
    const web3 = Web3Integrate.getWeb3()
    if (!web3) return
    if (!account) return
    console.log(event.target?.result);
    const sub:ProofOfOwnership = {
      id: account,
      nonce:'123456'
    }
    const c = new Credential([CredentialTypes.ProofOfOwnership], account, sub)
    const proof:CredentialProof = new CredentialProof(
      'nonceSigning',
      await web3.eth.personal.sign(JSON.stringify(c), account)
    )
    c.addProof(proof)
    setCredential(c)
  }

  return (
    <div className="container-sm limiter-md content">
      <h1>Credential Verification</h1>
      <h5 className="mb-4">Validate the signatures and expiration of a credential.</h5>
        {!account && (
          <div className="d-flex justify-content-center">
            <div className="row text-secondary">
              <div className="col-12 text-center">
                <ExclamationTriangle></ExclamationTriangle>
              </div>
              <div className="col-12 text-center">
                No connected account. This is needed to verify signatures.
              </div>
            </div>
          </div>
        )}
        {account && !credential && (
          <div>
            <div className="mb-4 d-flex justify-content-center">
              <label className="btn btn-primary">
                <input type="file" id="up" accept=".json" onChange={loadCredential} />
                <div>Upload a Credential File</div>
                <Diagram2 size="64px"></Diagram2>
              </label>
            </div>
          </div>
        )}
        {account && credential && (
          <div className="card card-body px-4">
            {JSON.stringify(credential, undefined, 2)}
          </div>
        )}
    </div>
  )
}

export default connect((state: IState) => ({
  account: state.account.account,
  network: state.account.network,
  privatekey: state.account.privatekey,
}))(Verifier)
