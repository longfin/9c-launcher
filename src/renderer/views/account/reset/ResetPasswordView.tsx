import React, { useState, useEffect } from "react";
import { TextField, Button, Typography } from "@material-ui/core";
import { RouterStore } from "mobx-react-router";
import {
  useConvertPrivateKeyToAddressQuery,
  useRevokePrivateKeyMutation,
  useCreatePrivateKeyMutation,
} from "../../../../generated/graphql";
import AccountStore from "../../../stores/account";
import { inject, observer } from "mobx-react";

import registerPrivateKeyViewStyle from "./ResetPasswordView.style";

import { useLocale } from "../../../i18n";
import { RegisterPrivateKey } from "../../../../interfaces/i18n";
import RetypePasswordForm from "../../../components/RetypePasswordForm";

interface IResetPasswordViewProps {
  accountStore: AccountStore;
  routerStore: RouterStore;
}

const ResetPasswordView: React.FC<IResetPasswordViewProps> = observer(
  ({ accountStore, routerStore }) => {
    const [firstPassword, setFirstPassword] = useState("");
    const [secondPassword, setSecondPassword] = useState("");

    const classes = registerPrivateKeyViewStyle();

    const { locale } = useLocale<RegisterPrivateKey>("registerPrivateKey");

    const {
      loading: loadingAddress,
      data,
    } = useConvertPrivateKeyToAddressQuery({
      variables: {
        privateKey: accountStore.privateKey,
      },
    });
    const [revokePrivateKey] = useRevokePrivateKeyMutation();
    const [createPrivateKey] = useCreatePrivateKeyMutation();

    const handleSubmit = async (password: string) => {
      const address = data?.keyStore?.privateKey.publicKey.address;
      if (address === undefined) throw Error("Address not found");
      if (loadingAddress) return;
      try {
        await revokePrivateKey({
          variables: { address },
        });
      } finally {
        await createPrivateKey({
          variables: {
            privateKey: accountStore.privateKey,
            passphrase: password,
          },
        });
        routerStore.push("/");
      }
    };

    return (
      <div className={classes.root}>
        <Typography variant="h1" className={classes.title}>
          {locale("비밀번호를 재설정해주세요.")}
        </Typography>
        <RetypePasswordForm onSubmit={handleSubmit} />
      </div>
    );
  }
);

export default inject("accountStore", "routerStore")(ResetPasswordView);
