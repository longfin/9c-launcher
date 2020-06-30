import * as React from "react";
import { useState } from "react";
import gql from "graphql-tag";
import { useQuery } from "react-apollo";
import { LOCAL_SERVER_URL, standaloneProperties } from "../../../config";
import { IStoreContainer } from "../../../interfaces/store";
import {
  FormControl,
  Select,
  MenuItem,
  LinearProgress,
} from "@material-ui/core";
import { observer, inject } from "mobx-react";
import { useDecreyptedPrivateKeyLazyQuery } from "../../../generated/graphql";
import Alert from "../../components/Alert";
import Snackbar from "@material-ui/core/Snackbar";
import { AccountSelect } from "../../components/AccountSelect";
import ClearCacheButton from "../../components/ClearCacheButton";

const QUERY_CRYPTKEY = gql`
  query {
    keyStore {
      protectedPrivateKeys {
        address
      }
    }
  }
`;

const GET_DECRYPTKEY = gql`
  query decreyptedPrivateKey($address: Address, $passphrase: String) {
    keyStore {
      decryptedPrivateKey(address: $address, passphrase: $passphrase)
    }
  }
`;

const LoginView = observer((props: IStoreContainer) => {
  const [passphrase, setPassphrase] = useState("");
  const [openSnackbar, setSnackbarStatus] = useState(false);
  const { accountStore, routerStore } = props;
  const [
    getDecreyptedKey,
    { loading, data },
  ] = useDecreyptedPrivateKeyLazyQuery();

  React.useEffect(() => {
    if (data?.keyStore?.decryptedPrivateKey !== undefined) {
      const privateKey = data.keyStore.decryptedPrivateKey;
      accountStore.setPrivateKey(privateKey);
      accountStore.toggleLogin();
      routerStore.push("/lobby");

      const properties = {
        ...standaloneProperties,
        PrivateKeyString: privateKey,
      };
      console.log(properties);
      fetch(`http://${LOCAL_SERVER_URL}/initialize-standalone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(properties),
      })
        .then((response) => response.text())
        .then((body) => console.log(body))
        .then((_) =>
          fetch(`http://${LOCAL_SERVER_URL}/run-standalone`, {
            method: "POST",
          })
        )
        .then((response) => response.text())
        .then((body) => console.log(body))
        .then((_) => {})
        .catch((error) => console.log(error));
    }
  });

  const handleSubmit = () => {
    getDecreyptedKey({
      variables: {
        address: accountStore.selectedAddress,
        passphrase: passphrase,
      },
    });
  };

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbarStatus(false);
  };

  // FIXME 키가 하나도 없을때 처리는 안해도 되지 않을지?
  if (!accountStore.selectedAddress && accountStore.addresses.length > 0) {
    accountStore.setSelectedAddress(accountStore.addresses[0]);
  }

  return (
    <div>
      <form>
        <FormControl>
          <AccountSelect
            addresses={accountStore.addresses}
            onChangeAddress={accountStore.setSelectedAddress}
            selectedAddress={accountStore.selectedAddress}
          />
        </FormControl>
        <br />
        <label>Passphrase</label>{" "}
        <input
          type="password"
          onChange={(event) => {
            setPassphrase(event.target.value);
          }}
          onKeyDown={(event) => {
            // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
            const enterKeyCode = 13;
            if (enterKeyCode === event.keyCode) {
              handleSubmit();
            }
          }}
        ></input>
      </form>
      <button
        disabled={loading}
        onClick={(event) => {
          handleSubmit();
        }}
      >
        Login{" "}
      </button>
      <br />
      <button onClick={() => routerStore.push("/account")}>
        {" "}
        Account Management{" "}
      </button>
      <br />
      <ClearCacheButton disabled={false} />
      <br />
      <button onClick={() => routerStore.push("/config")}> Config </button>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity="error">
          passphrase is wrong.
        </Alert>
      </Snackbar>
    </div>
  );
});

export default inject("accountStore", "routerStore", "gameStore")(LoginView);