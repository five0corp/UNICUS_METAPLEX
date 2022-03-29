import React, { useEffect, useState, useCallback } from 'react';

import { UserValue } from './../../components/UserSearch';
import {
  Steps,
  Row,
  Button,
  Upload,
  Col,
  Input,
  Statistic,
  Slider,
  Progress,
  Spin,
  InputNumber,
  Form,
  Typography,
} from 'antd';
import { ArtCard } from './../../components/ArtCard';
import './../styles.less';
import { mintNFT } from '../../actions';
import axios from 'axios';
import {
    MAX_METADATA_LEN,
    useConnection,
    useWallet,
    IMetadataExtension,
    MetadataCategory,
    useConnectionConfig,
    Creator,
    ENV,
    shortenAddress,
    MetaplexModal,
    MetaplexOverlay,
  } from '@oyster/common';
  import { getAssetCostToStore, LAMPORT_MULTIPLIER } from '../../utils/assets';
  import { Connection, PublicKey } from '@solana/web3.js';
  import { MintLayout } from '@solana/spl-token';
  import {  useParams } from 'react-router-dom';
  import { cleanName } from '../../utils/utils';
import { jsonToBase64 } from '@toruslabs/openlogin-utils';

  export interface IAssetDetails {
    id: string;
    name: string;
    description: string;
    image: string;
  }

  export const NftCreateView = () => {
  const [finish,setFinish] = useState(0);
  const [progress, setProgress] = useState<number>(0);
  const [updateUnicus,setUpdateUnicus] = useState(0);
    const { id } = useParams<{ id: string }>();
    const connection = useConnection();
    const { env } = useConnectionConfig();

    const { wallet,connected, connect,select, provider } = useWallet();

    
    const [mainFile, setMainFile] = useState<any>();
    const [coverFile, setCoverFile] = useState<any>();
    const [image, setImage] = useState<string>('');
    const [imageURL, setImageURL] = useState<string>('');

    const SERVER_URL = process.env.REACT_APP_UNICUS_SERVER_URL ? new String(`${process.env.REACT_APP_UNICUS_SERVER_URL}`)
    : undefined;;
    const SOLANA_ENV = process.env.REACT_APP_SOLANA_SERVER_CONNECT ? new String(`${process.env.REACT_APP_SOLANA_SERVER_CONNECT}`)
    : undefined;;

    const [nft, setNft] =
    useState<{ metadataAccount: PublicKey }| undefined>(undefined);
    const [attributes, setAttributes] = useState<IMetadataExtension>({
        name: '',
        symbol: '',
        description: '',
        external_url: '',
        image: '',
        seller_fee_basis_points: 0,
        creators: [],
        properties: {
        files: [],
        category: MetadataCategory.Image,
        },
    });
    const [details_, setDetails_] = useState<IAssetDetails>({
        name: '',
        description: '',
        image: '',
        id: '',
     });

     const walletconnect = async() => {
        if(!connected) {
            connect()
        }
     }
     
     const mint = async () => {
        const fileNames = (attributes?.properties?.files || []).map(f =>
        typeof f === 'string' ? f : f.name,
        );
        const files = (attributes?.properties?.files || []).filter(
        f => typeof f !== 'string',
        ) as File[];
        const metadata = {
        name: attributes.name,
        symbol: attributes.symbol,
        creators: attributes.creators,
        description: attributes.description,
        sellerFeeBasisPoints: attributes.seller_fee_basis_points,
        image: fileNames && fileNames?.[0] && fileNames[0],
        external_url: attributes.external_url,
        properties: {
            files: fileNames,
            category: attributes.properties?.category,
        },
        };

        // Update progress inside mintNFT
        var inte = setInterval(
          () => setProgress(prog => Math.min(prog + 1, 99)),
          400,
        );

        // const _nft = await mintNFT(
        //                       connection,
        //                       wallet,
        //                       'devnet',
        //                       files,
        //                       metadata,
        //                       attributes.properties?.maxSupply,
        //                     );
        const _nft = await mintNFT(
          connection,
          wallet,
          SOLANA_ENV as ENV,
          files,
          metadata,
          attributes.properties?.maxSupply,
        );                      

        if (_nft) {
          setNft(_nft);
          setUpdateUnicus(1)
        }
        clearInterval(inte);
        //setFinish(3)

    };

    const assetNFT = {
      "name": "",
      "description": "",
      "image": "",
      "id": "",
      "nft":"",
      "cost":""
    }

    const key = typeof id === 'string' ? id : '';
    const [creators, setCreators] = useState<Array<UserValue>>([]);
    const [assetFetched, setAsset] = useState<boolean>(false);
    const [owner, setOwner] = useState<boolean>(false);
    const [cost, setCost] = useState(0);

    const updateUnicusServer = async() => {
      var nftTx = ''
      if(nft?.metadataAccount == undefined) {
        nftTx = ""
      } else {
        nftTx = nft?.metadataAccount?.toBase58()
      }

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name : details_.name,
          description : details_.description,
          image : details_.image,
          id : details_.id,
          nft : nftTx ,
          cost: cost.toFixed(5)})
      };
      
      //const apiUrl = 'https://art-unic.com/asset/updated.do?assetid='+details_.id+"&nft_id="+nftTx+"&nft_cost="+cost.toFixed(5)

      
      const apiUrl = SERVER_URL+'asset/updated.do?assetid='+details_.id+"&nft_id="+nftTx+"&nft_cost="+cost.toFixed(5)
      console.log('update apiUrl: '+apiUrl)
      axios.get(apiUrl).then((repos) => {
        const json = repos.data;
        console.log('update json: '+json)
        if(json == "SUCCESS")
          setFinish(3)           
      })
      .catch(error => {
        console.log('update error: '+error)
        return error;
      });      

   }

    // 1. connect to the wallet
    useEffect(() => {
      const waitTillConnect = async() => {
        if(!connected) {
          await walletconnect()
        }
      } 
      waitTillConnect()
    }, []);

    // 2. fetch the asset information from unicus
    useEffect(() => {
        if(connected) {

        if(key) {

//          const apiUrl = 'https://art-unic.com/asset.do?assetid='+id;
          const apiUrl = SERVER_URL+'asset.do?assetid='+id;
          axios.get(apiUrl).then((repos) => {
            const json = repos.data;
            console.log('details json: '+json)
            setAttributes({
              ...attributes,
              properties: {
                ...attributes.properties,
                files: json.image
                  ? [json.image]
                  : [mainFile, coverFile]
                      .filter(f => f)
                      .map(
                        f => new File([f], cleanName(f.name), { type: f.type }),
                      ),
              },
              image: json.image || image,
            });

            setDetails_(json);
            setAsset(true)
            setFinish(1)           
          })
          .catch(error => {
            console.log('details error: '+error)
            return error;
          });

          }
      }
    }, [connected,wallet]);

    // 3. create the creator of the asset
    useEffect(() => {
      if(assetFetched) {
        if (wallet?.publicKey) {
          const key = wallet.publicKey.toBase58();
          setCreators([
              {
                key,
                label: shortenAddress(key),
                value: key,
              },
            ]);
        }
      }
    }, [assetFetched,wallet]);

    // 4. assign the owner/creator of the asset to the attibutes
    useEffect(() => {
      if(creators.length > 0) {
        const creatorStructs: Creator[] = [...creators].map (c => new Creator({
          address: new PublicKey(c.key),
          verified: true, //key === wallet?.publicKey?.toBase58()
          share:100
          })
        );
        setAttributes({
            ...attributes,
            creators: creatorStructs,
        }); 
        attributes.name = details_.name
        attributes.description = details_.description
        attributes.properties.maxSupply = 0
        attributes.creators = creatorStructs
        setOwner(true)
        setFinish(2)
      }
    }, [creators,setCreators]);

    // 5. compute the total cost for the transaction
    useEffect(() => {
      const rentCall = Promise.all([
        connection.getMinimumBalanceForRentExemption(MintLayout.span),
        connection.getMinimumBalanceForRentExemption(MAX_METADATA_LEN),
      ]);

      const fileNames = (attributes?.properties?.files || []).map(f =>
        typeof f === 'string' ? f : f.name,
        );
        const files = (attributes?.properties?.files || []).filter(
        f => typeof f !== 'string',
        ) as File[];
       const metadata = {
          ...(attributes as any),
          files: fileNames,
        };

      if (metadata.files.length)
        getAssetCostToStore([
          ...files,
          new File([JSON.stringify(metadata)], 'metadata.json'),
        ]).then(async lamports => {
          const sol = lamports / LAMPORT_MULTIPLIER;
  
          // TODO: cache this and batch in one call
          const [mintRent, metadataRent] = await rentCall;
  
          // const uriStr = 'x';
          // let uriBuilder = '';
          // for (let i = 0; i < MAX_URI_LENGTH; i++) {
          //   uriBuilder += uriStr;
          // }
  
          const additionalSol = (metadataRent + mintRent) / LAMPORT_MULTIPLIER;
  
          // TODO: add fees based on number of transactions and signers
          setCost(sol + additionalSol);
        });
    }, [owner,setOwner,wallet]);

    // 6. invoke the mint to set the transaction rolling
    useEffect(() => {
      if(owner) {
        const func = async () => {
          await mint();
        };
        func();
      }
    }, [cost,setCost]);  

    // 7. if mint successfull send response to Unicus
    useEffect(() => {
      if(updateUnicus == 1) {
        const update = async() => {
            await updateUnicusServer()
        } 
        update()
      }
    }, [updateUnicus, setUpdateUnicus]);  

    function showPage() {

      if(finish == 1) {
        return (
                <>
                  <Row className="call-to-action">
                    <h2>Launch your creation</h2>
                    <p>
                    Details fetched from Unicus server :
                    </p>
                  </Row>
                  <Row className="content-action" justify="space-around">
                    <Col>
                      <ArtCard
                        image={details_.image}
                        name={details_.name}
                        small={true}
                      />
                    </Col>
                  </Row>
                </>
        );
      } 
      if(finish == 2) {
        return(
                  <div
                    style={{
                      marginTop: 70,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                    >
                    <Progress type="circle" percent={progress} />
                    <div className="waiting-title">
                      Your creation is being uploaded to the decentralized web...
                    </div>
                    <div className="waiting-subtitle">This can take up to 1 minute.</div>
                  </div>
        );
      }
  
      if(finish == 3) {
        return(
          <MetaplexOverlay visible={finish === 3}>
                <Row className="content-action" justify="space-around">
                  <Col>
                    <ArtCard
                      image={details_.image}
                      name={details_.name}
                      small={true}
                    />
                  </Col>
                </Row>
                <Congrats nft={nft} />
                <div className="waiting-title">Cost :  {cost.toFixed(5)} SOL</div>
              </MetaplexOverlay>
        );
      }
  
    }

    return (
       <div>
          {showPage()}
       </div>
    );

  };


  const Congrats = (props: {
    nft?: {
      metadataAccount: PublicKey;
    };
  }) => {
    
  
    return (
      <>
        <div className="waiting-title">Congratulations, you created an NFT!</div>
        <div className="waiting-title">Txn : {props.nft?.metadataAccount.toBase58()}</div>
      </>
    );
  };





  


