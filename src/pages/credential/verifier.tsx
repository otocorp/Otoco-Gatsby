import React from 'react'
import { Helmet } from 'react-helmet'
import loadable from '@loadable/component'
import Layout from '../../components/dashboard/layout/layout'
const Verifier = loadable(() => import('../../components/credential/verifier'))

interface Props {
  location: Location
}

const CredentialVerifier: React.FC<Props> = ({ location }: Props) => {
  return (
    <Layout location={location}>
      <Helmet title="Otoco - Certificate Verifier" defer={false} />
        <Verifier />
    </Layout>
  )
}

export default CredentialVerifier
