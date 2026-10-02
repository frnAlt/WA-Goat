/**
 * Multi-Account Manager for Floppa-WCA & GoatBot compatibility
 */

class MultiAccountManager {
  constructor() {
    this.isSwitching = false;
    this.switchCount = 0;
    this.failedAccounts = [];
    this.accounts = ['account.txt', 'wa_web.json'];
    this.currentAccount = 'account.txt';
  }

  getStats() {
    return {
      totalAccounts: this.accounts.length,
      currentAccount: this.currentAccount,
      availableAccounts: this.accounts,
      failedAccounts: this.failedAccounts,
      switchCount: this.switchCount,
      canSwitch: true
    };
  }

  nextAccount() {
    this.switchCount++;
    const idx = this.accounts.indexOf(this.currentAccount);
    this.currentAccount = this.accounts[(idx + 1) % this.accounts.length];
    return this.currentAccount;
  }

  resetFailedAccounts() {
    this.failedAccounts = [];
    return true;
  }
}

module.exports = new MultiAccountManager();
