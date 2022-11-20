import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Pact from "pact-lang-api";
import { local, signAndSend } from "../../kda-wallet/store/kadenaSlice";

function Admin() {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.kadenaInfo.account);
  const metaInfo = useSelector((state) => state.metaInfo);
  const { code, envData, caps, gasLimit, gasPrice, chainIds } = metaInfo;

  const [balance, setBalance] = useState(0);
  const [treasury, setTreasury] = useState(0);

  const [depositAmt, setDepositAmt] = useState(0);
  const [withdrawAmt, setWithdrawAmt] = useState(0);

  const [txResult, setTxResult] = useState("");

  const bank_account =
    "u:free.coinflip-ryu-latest.require-WITHDRAW:DldRwCblQ7Loqy6wYJnaodHl30d3j3eH-qtFzfEv46g";

  // Local Update Timer //
  var timer;

  useEffect(() => {
    setBalance(0);
    setTreasury(0);
    if (timer) {
      clearInterval(timer);
    }
    if (account !== "") {
      timer = setInterval(async () => {
        let res1 = await dispatch(
          local(
            "1",
            `(coin.details "${account}")`,
            envData,
            caps,
            gasLimit,
            gasPrice,
            true
          )
        );
        if (res1.result?.status === "success") {
          setBalance(res1.result.data.balance);
        }
        let res2 = await dispatch(
          local(
            "1",
            `(coin.details "${bank_account}")`,
            envData,
            caps,
            gasLimit,
            gasPrice,
            true
          )
        );
        if (res2.result?.status === "success") {
          setTreasury(res2.result.data.balance);
        }
      }, 3000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [account]);

  const deposit = async () => {
    const transferArgs = [account, bank_account, parseFloat(depositAmt)];
    const depositCaps = [
      Pact.lang.mkCap("Gas", "gas", "coin.GAS"),
      Pact.lang.mkCap("Trasfer", "transfer", "coin.TRANSFER", transferArgs),
      Pact.lang.mkCap("Ops", "ops", "free.coinflip-ryu-latest.OPS"),
    ];
    setTxResult("Pending");
    const res = await dispatch(
      signAndSend(
        "1",
        `(free.coinflip-ryu-latest.deposit-to-bank "${account}" ${depositAmt})`,
        envData,
        depositCaps,
        gasLimit,
        gasPrice,
        true
      )
    );
    if (res) {
      res.listenPromise
        .then((data) => {
          if (data.result.status === "success") {            
            setTxResult("Success");
          } else {
            setTxResult("Failure");
          }
        })
        .catch(() => {
          setTxResult("Failure");
        });
    } else {
      setTxResult("Failure");
    }
  };

  const withdraw = async () => {
    const transferArgs = [bank_account, account, parseFloat(withdrawAmt)];
    const withdrawCaps = [
      Pact.lang.mkCap("Gas", "gas", "coin.GAS"),
      Pact.lang.mkCap("Trasfer", "transfer", "coin.TRANSFER", transferArgs),
      Pact.lang.mkCap("Ops", "ops", "free.coinflip-ryu-latest.OPS"),
    ];
    setTxResult("Pending");
    const res = await dispatch(
      signAndSend(
        "1",
        `(free.coinflip-ryu-latest.withdraw-from-bank "${account}" ${withdrawAmt})`,
        envData,
        withdrawCaps,
        gasLimit,
        gasPrice,
        true
      )
    );
    if (res) {
      res.listenPromise
        .then((data) => {
          if (data.result.status === "success") {
            setTxResult("Success");
          } else {
            setTxResult("Failure");
          }
        })
        .catch(() => {
          setTxResult("Failure");
        });
    } else {
      setTxResult("Failure");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="text-xl font-bold">Your Balance: {balance}</div>
      <div className="text-xl font-bold">Treasury: {treasury}</div>
      <input
        type="number"
        className="border h-10 px-2"
        value={depositAmt}
        onChange={(e) => {
          setDepositAmt(e.target.value);
        }}
      />
      <button
        className="my-3 bg-pink-400 px-8 py-4 text-xl font-bold"
        onClick={deposit}
      >
        Deposit To Bank
      </button>
      <input
        type="number"
        className="border h-10 px-2"
        value={withdrawAmt}
        onChange={(e) => {
          setWithdrawAmt(e.target.value);
        }}
      />
      <button
        className="my-3 bg-pink-400 px-8 py-4 text-xl font-bold"
        onClick={withdraw}
      >
        Withdraw From Bank
      </button>
      {txResult !== "" && (
        <div className="flex justify-start w-full font-bold">
          <h2>Tx Status: {txResult}</h2>
        </div>
      )}
      <Link to="/home">
        <button className="my-3">{`<`} Go to Home</button>
      </Link>
    </div>
  );
}

export default Admin;
