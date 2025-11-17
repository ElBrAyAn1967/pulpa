import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Lock", function () {
  async function deployLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
    const lockedAmount = ethers.parseEther("1");

    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await deployLockFixture();
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await deployLockFixture();
      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should receive and store the funds", async function () {
      const { lock, lockedAmount } = await deployLockFixture();
      expect(await ethers.provider.getBalance(lock.target)).to.equal(
        lockedAmount
      );
    });

    it("Should fail if unlock time is not in the future", async function () {
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        "Unlock time should be in the future"
      );
    });
  });

  describe("Withdrawals", function () {
    it("Should revert with the right error if called too soon", async function () {
      const { lock } = await deployLockFixture();
      await expect(lock.withdraw()).to.be.revertedWith(
        "You can't withdraw yet"
      );
    });

    it("Should revert with the right error if called from another account", async function () {
      const { lock, unlockTime, otherAccount } = await deployLockFixture();
      await time.increaseTo(unlockTime);
      await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
        "You aren't the owner"
      );
    });

    it("Should transfer the funds to the owner", async function () {
      const { lock, unlockTime, lockedAmount, owner } =
        await deployLockFixture();
      await time.increaseTo(unlockTime);

      await expect(lock.withdraw()).to.changeEtherBalances(
        [owner, lock],
        [lockedAmount, -lockedAmount]
      );
    });
  });
});
