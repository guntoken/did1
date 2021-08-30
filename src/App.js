import './App.css';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { useState } from 'react';

import CeramicClient from '@ceramicnetwork/http-client';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver';

import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect';
import { DID } from 'dids';
import { IDX } from '@ceramicstudio/idx';

const endpoint = 'https://ceramic-clay.3boxlabs.com';

function App() {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [loaded, setLoaded] = useState(false);

  async function connect() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    console.log('from web3modal: ', address);

    return address;
  }

  async function readProfile() {
    if(typeof window.ethereum !== 'undefined') {
      const address = await connect();

      const ceramic = new CeramicClient(endpoint);
      const idx = new IDX({ ceramic });

      if (typeof address !== 'undefined') {
        console.log('reading:', address);

        try {
          const data = await idx.get(
            'basicProfile',
            `${address}@eip155:1`
          );
          console.log('data:', data);
          if (data.name) setName(data.name);
          if (data.avatar) setImage(data.avatar);
        } catch (error) {
          console.log('error: ', error);
          setLoaded(true);
        }
      } else {
        window.alert('Please login with MetaMask');
      }
    } else {
      window.alert('Please install MetaMask');
    }
  }

  async function updateProfile() {
    if(typeof window.ethereum !== 'undefined') {
      const address = await connect();

      const ceramic = new CeramicClient(endpoint);
      const threeIdConnect = new ThreeIdConnect();

      if (typeof address !== 'undefined') {
        const provider = new EthereumAuthProvider(window.ethereum, address);

        console.log('writing:', address);

        await threeIdConnect.connect(provider);

        const did = new DID({
          provider: threeIdConnect.getDidProvider(),
          resolver: { ...ThreeIdResolver.getResolver(ceramic) },
        });

        ceramic.setDID(did);
        await ceramic.did.authenticate();

        const idx = new IDX({ ceramic });

        await idx.set('basicProfile', {
          name,
          avatar: image,
        });

        console.log('Profile updated!');
      } else {
        window.alert('Please install MetaMask');
      }
    } else {
      window.alert('Please install MetaMask');
    }
  }

  return (
    <div className="App">
      <input placeholder="Name" onChange={e => setName(e.target.value)} />
      <input placeholder="Profile Image" onChange={e => setImage(e.target.value)} />
      <button onClick={updateProfile}>Set Profile</button>
      <button onClick={readProfile}>Read Profile</button>

      { name && <h3>{name}</h3> }
      { image && <img style={{ width: '400px' }} src={image} /> }
      { (!image && !name && loaded) && <h4>No profile, please create one...</h4> }
    </div>
  );
}

export default App;
 