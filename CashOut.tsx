import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMiningGame } from "@/lib/stores/useMiningGame";
import { CURRENCY_EXCHANGE_RATE } from "@/lib/gameConfig";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PayPalButton from "./PayPalButton";
import { FaCreditCard, FaPaypal, FaBitcoin, FaGem } from "react-icons/fa";

export default function CashOut() {
  const { gameState, cashOut } = useMiningGame();
  const [cashOutAmount, setCashOutAmount] = useState<number>(0);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate real money equivalent
  const realMoneyEquivalent = cashOutAmount / CURRENCY_EXCHANGE_RATE;
  const formattedRealMoney = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(realMoneyEquivalent);
  
  // Calculate daily limits
  const today = new Date().toISOString().split('T')[0];
  const isNewDay = today !== gameState.lastCashOutDay;
  const availableDailyLimit = isNewDay ? gameState.dailyCashOutLimit : (gameState.dailyCashOutLimit - gameState.dailyCashOutUsed);
  const formattedDailyLimit = new Intl.NumberFormat('en-US', {
    style: 'currency', 
    currency: 'USD'
  }).format(availableDailyLimit);

  // Minimum amount required for cash out
  const MIN_CASH_OUT = 100000;
  // Check if player has enough coins and is within daily limit
  const amountInUSD = cashOutAmount / CURRENCY_EXCHANGE_RATE;
  const exceedsDailyLimit = amountInUSD > availableDailyLimit;
  const canCashOut = 
    gameState.currency >= MIN_CASH_OUT && 
    cashOutAmount >= MIN_CASH_OUT && 
    cashOutAmount <= gameState.currency && 
    !exceedsDailyLimit;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleCashOutAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setCashOutAmount(value);
  };
  
  const handleMaxAmount = () => {
    setCashOutAmount(gameState.currency);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!cardDetails.cardNumber || !cardDetails.cardholderName || !cardDetails.expiryDate || !cardDetails.cvv) {
      toast.error("Please fill in all card details");
      return;
    }
    
    if (!canCashOut) {
      if (exceedsDailyLimit) {
        toast.error(`Cash out exceeds your daily limit of ${formattedDailyLimit}`);
      } else {
        toast.error("Cannot cash out. Please check requirements.");
      }
      return;
    }
    
    setIsProcessing(true);
    
    // Process the cash out with a small delay to simulate processing
    setTimeout(() => {
      // Call the cashOut function from our game state
      const success = cashOut(cashOutAmount);
      
      if (success) {
        toast.success(`Cash out request submitted! You will receive ${formattedRealMoney} soon.`);
        // Reset form
        setCashOutAmount(0);
        setCardDetails({
          cardNumber: "",
          cardholderName: "",
          expiryDate: "",
          cvv: "",
        });
      } else {
        toast.error("Cash out failed. Please try again later.");
      }
      
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-2">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Cash Out</h2>
        <p className="text-sm opacity-70">
          Convert your in-game currency to real money! Minimum cash out: {MIN_CASH_OUT.toLocaleString()} coins.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Cash Out Request</CardTitle>
          <CardDescription>
            Exchange Rate: {CURRENCY_EXCHANGE_RATE.toLocaleString()} coins = $1.00 USD
            <br />
            Daily Limit: {formattedDailyLimit} remaining
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cashOutAmount">Amount to Cash Out</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cashOutAmount"
                  type="number"
                  value={cashOutAmount || ""}
                  onChange={handleCashOutAmountChange}
                  placeholder="Enter amount to cash out"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleMaxAmount}
                  className="whitespace-nowrap"
                >
                  Max ({gameState.currency.toLocaleString()})
                </Button>
              </div>
              <div className="mt-1 text-sm">
                <span className="font-medium">Real money equivalent: </span>
                <span className="text-primary">{formattedRealMoney}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-bold mb-2">Payment Method</h3>
              
              <Tabs defaultValue="card" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="card" className="flex items-center gap-2">
                    <FaCreditCard className="h-4 w-4" />
                    <span>Card</span>
                  </TabsTrigger>
                  <TabsTrigger value="paypal" className="flex items-center gap-2">
                    <FaPaypal className="h-4 w-4" />
                    <span>PayPal</span>
                  </TabsTrigger>
                  <TabsTrigger value="crypto" className="flex items-center gap-2">
                    <FaBitcoin className="h-4 w-4" />
                    <span>Crypto</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="card" className="space-y-4 mt-4">
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.cardNumber}
                          onChange={handleInputChange}
                          maxLength={19}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cardholderName">Cardholder Name</Label>
                        <Input
                          id="cardholderName"
                          name="cardholderName"
                          placeholder="John Doe"
                          value={cardDetails.cardholderName}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            name="expiryDate"
                            placeholder="MM/YY"
                            value={cardDetails.expiryDate}
                            onChange={handleInputChange}
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            placeholder="123"
                            value={cardDetails.cvv}
                            onChange={handleInputChange}
                            maxLength={3}
                            type="password"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleSubmit}
                        disabled={!canCashOut || isProcessing}
                        className="w-full mt-4"
                      >
                        {isProcessing ? "Processing..." : `Cash Out ${formattedRealMoney}`}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="paypal" className="space-y-4 mt-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md mb-4">
                    <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">PayPal Cash Out</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Cash out directly to your PayPal account. Processing may take 1-2 business days.
                    </p>
                  </div>
                  
                  <div className={`w-full flex justify-center ${!canCashOut ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="w-full flex justify-center" style={{ maxWidth: '200px' }}>
                      {canCashOut ? (
                        <PayPalButton
                          amount={realMoneyEquivalent.toString()}
                          currency="USD"
                          intent="CAPTURE"
                        />
                      ) : (
                        <div className="text-center text-sm text-gray-500 mt-4">
                          You need at least {MIN_CASH_OUT.toLocaleString()} coins to cash out
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="crypto" className="space-y-4 mt-4">
                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-md mb-4">
                    <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">Crypto Cash Out</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Receive your earnings in cryptocurrency. We support Bitcoin, Ethereum, and Ardo.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="cryptoAddress">Wallet Address</Label>
                      <Input
                        id="cryptoAddress"
                        placeholder="Enter your crypto wallet address"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cryptoType">Cryptocurrency</Label>
                      <select 
                        id="cryptoType"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="btc">Bitcoin (BTC)</option>
                        <option value="eth">Ethereum (ETH)</option>
                        <option value="ardo">Ardo (ARDO)</option>
                      </select>
                    </div>
                    
                    <Button 
                      disabled={!canCashOut || isProcessing}
                      className="w-full mt-4"
                    >
                      {isProcessing ? "Processing..." : `Cash Out to Crypto (${formattedRealMoney})`}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4 bg-muted p-4 rounded-lg">
        <h3 className="font-bold mb-2">Cash Out Rules</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Minimum cash out amount: {MIN_CASH_OUT.toLocaleString()} coins</li>
          <li>Daily cash out limit: {formattedDailyLimit} (resets at midnight)</li>
          <li>Cash out requests are processed within 1-5 business days (varies by payment method)</li>
          <li>You can cash out using debit card, PayPal, or cryptocurrency</li>
          <li>Exchange rate may vary based on market conditions</li>
          <li>Premium subscription increases your daily cash out limit</li>
        </ul>
      </div>
    </div>
  );
}