import Web3Integrate from '../services/web3-integrate'
import { Contract } from 'web3-eth-contract'
const mainContractABI = [
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint256',
        name: '_newFee',
        type: 'uint256',
      },
    ],
    name: 'changeSeriesFee',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'contract IERC20',
        name: 'newTkn',
        type: 'address',
      },
    ],
    name: 'changeTknAddr',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'string',
        name: 'seriesName',
        type: 'string',
      },
    ],
    name: 'createSeries',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [],
    name: 'withdrawTkn',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IERC20',
        name: '_tkn',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: '_oldTknAddr',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: '_newTknAddr',
        type: 'address',
      },
    ],
    name: 'TokenAddrChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'src',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'val',
        type: 'uint256',
      },
    ],
    name: 'ReceiveTokenFrom',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: '_contract',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: '_owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_name',
        type: 'string',
      },
    ],
    name: 'NewSeriesCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: '_oldFee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_newFee',
        type: 'uint256',
      },
    ],
    name: 'SeriesFeeChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: '_owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_total',
        type: 'uint256',
      },
    ],
    name: 'TokenWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    constant: true,
    inputs: [],
    name: 'balanceTkn',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'isOwner',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'isUnlockTkn',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'mySeries',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'seriesFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export default {
  addresses: {
    dev: '',
    //kovan_us_de: "0xbc8006E109CA3Cb5b2a88aDD9F87BDf9a7fB924E",
    kovan_us_de: '0x7353CAe6fCcA50bE63e4685D7Dbb9b3B44c8eF51',
    kovan_us_wy: '0x50ccB248667e116299cd1d2999713A709A78E077',
    main_us_de: '0x24870e04F2573a132B695c48eB9ff2F3C8b0f410',
    main_us_wy: '0xfc952ECF2EE199fa8C63A86424e3978F2dEB86eF',
    ropsten_us_de: '0x861995A262516A98c1faCE4c63beE22fbc6251C6',
    ropsten_us_wy: '0x8f332A747e4907fa51921F4e025cb1aE6fbBe9b2',
    private_us_de: '0x4bfd9Cd9DA9e9D2258796f62fD2B3D3C44dEe479',
    private_us_wy: '0x4bfd9Cd9DA9e9D2258796f62fD2B3D3C44dEe479',
  },
  abi: mainContractABI,
  getContract: function (network = 'kovan', jurisdiction = 'de'): Contract {
    const web3 = Web3Integrate.getWeb3()
    return new web3.eth.Contract(
      this.abi,
      this.addresses[network + '_' + jurisdiction]
    )
  },
}
