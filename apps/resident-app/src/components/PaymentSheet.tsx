import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initiatePayment, verifyPayment } from '../services/billing';
import type { Bill, PaymentOrder } from '../services/billing';

// ─── Design Tokens ───────────────────────────────────────────────
const Colors = {
  primary: '#2563EB',
  surface: '#FFFFFF',
  textPrimary: '#0B1C30',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  successBg: '#DCFCE7',
  successText: '#166534',
  dangerText: '#DC2626',
  surfaceContainerLow: '#EFF4FF',
};

interface PaymentSheetProps {
  bill: Bill;
  onPaymentComplete: (updatedBill: Bill) => void;
}

export function PaymentSheet({ bill, onPaymentComplete }: PaymentSheetProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStage, setPaymentStage] = useState<'idle' | 'initiating' | 'checkout' | 'verifying' | 'success' | 'error'>('idle');

  const amountDue = bill.amountDue - bill.amountPaid;

  const handlePay = async () => {
    try {
      setIsProcessing(true);
      setPaymentStage('initiating');

      const order: PaymentOrder = await initiatePayment(bill.id);

      if (order.isMock) {
        setPaymentStage('checkout');
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setPaymentStage('verifying');
        const updatedBill = await verifyPayment(bill.id, {
          razorpayOrderId: order.orderId,
          razorpayPaymentId: `mock_pay_${Date.now()}`,
          razorpaySignature: 'mock_signature',
        });

        setPaymentStage('success');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onPaymentComplete(updatedBill);
      } else {
        setPaymentStage('checkout');
        try {
          const RazorpayCheckout = require('react-native-razorpay');

          const options = {
            description: order.description,
            image: 'https://i.imgur.com/3g7nmJC.png',
            currency: order.currency,
            key: order.keyId,
            amount: order.amount,
            name: 'Community App',
            order_id: order.orderId,
            prefill: { contact: '', email: '' },
            theme: { color: Colors.primary },
          };

          const paymentData = await RazorpayCheckout.open(options);

          setPaymentStage('verifying');
          const updatedBill = await verifyPayment(bill.id, {
            razorpayOrderId: order.orderId,
            razorpayPaymentId: paymentData.razorpay_payment_id,
            razorpaySignature: paymentData.razorpay_signature,
          });

          setPaymentStage('success');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          onPaymentComplete(updatedBill);
        } catch (razorpayError: unknown) {
          const errorMsg = razorpayError instanceof Error ? razorpayError.message : 'Payment was cancelled or failed';
          Alert.alert('Payment Failed', errorMsg);
          setPaymentStage('error');
        }
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Something went wrong';
      Alert.alert('Payment Error', errorMsg);
      setPaymentStage('error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPaymentStage('idle'), 2000);
    }
  };

  if (bill.status === 'PAID') {
    return (
      <View style={styles.paidContainer}>
        <View style={styles.paidIconCircle}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.successText} />
        </View>
        <Text style={styles.paidTitle}>Payment Complete</Text>
        {bill.paymentId && (
          <Text style={styles.paidDetail}>Payment ID: {bill.paymentId}</Text>
        )}
        {bill.paidAt && (
          <Text style={styles.paidDetail}>
            Paid on: {new Date(bill.paidAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </Text>
        )}
      </View>
    );
  }

  const stageMessages = {
    idle: '',
    initiating: 'Creating payment order...',
    checkout: 'Processing payment...',
    verifying: 'Verifying payment...',
    success: 'Payment successful!',
    error: 'Payment failed',
  };

  return (
    <View style={styles.container}>
      {paymentStage !== 'idle' && paymentStage !== 'error' && (
        <View style={styles.progressContainer}>
          {paymentStage !== 'success' ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.spinner} />
          ) : (
            <Ionicons name="checkmark-circle" size={18} color={Colors.successText} style={styles.spinner} />
          )}
          <Text style={[
            styles.progressText,
            paymentStage === 'success' && styles.successText,
          ]}>
            {stageMessages[paymentStage]}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.payButton,
          isProcessing && styles.payButtonDisabled,
          bill.status === 'OVERDUE' && styles.payButtonOverdue,
        ]}
        onPress={handlePay}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.payButtonText}>
              Pay ₹{amountDue.toLocaleString('en-IN')}
            </Text>
            {bill.status === 'OVERDUE' && (
              <Text style={styles.payButtonSubtext}>Overdue — pay now to avoid penalties</Text>
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  paidContainer: {
    marginTop: 4,
    backgroundColor: Colors.successBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  paidIconCircle: {
    marginBottom: 4,
  },
  paidTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.successText,
  },
  paidDetail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.successText,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  spinner: {
    marginRight: 8,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  successText: {
    color: Colors.successText,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonOverdue: {
    backgroundColor: Colors.dangerText,
    shadowColor: Colors.dangerText,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  payButtonSubtext: {
    color: '#FEE2E2',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    marginTop: 4,
  },
});
