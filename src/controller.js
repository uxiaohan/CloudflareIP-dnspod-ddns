const moment = require("moment");
const axios = require("axios");
// 配置
const { secretId, secretKey, Domain, SubDomain } = require("./config");
const tencentcloud = require("tencentcloud-sdk-nodejs-dnspod");
// 更新 Cloudflare 优选IP开始-----------------------------------------------------------------------------------------------------
const updateCloudflareIp = async () => {
  const res = await axios.get("https://api.vvhan.com/tool/cf_ip");
  if (!res.data.success) {
    console.log("\x1b[91m%s\x1b[0m", "更新 Cloudflare 优选IP失败");
    return "更新 Cloudflare 优选IP失败";
  }
  return await updateTencentDns(res.data.data);
};
// 更新 Cloudflare 优选IP结束-----------------------------------------------------------------------------------------------------

// 更新腾讯DNSPOD DNS开始-----------------------------------------------------------------------------------------------------
const DnspodClient = tencentcloud.dnspod.v20210323.Client;
const TENCENT_DNSPOD_clientConfig = {
  credential: { secretId, secretKey },
  profile: { httpProfile: { endpoint: "dnspod.tencentcloudapi.com" } }
};
// 更新
const updateTencentDns = async IP_DATA => {
  // 查询域名列表
  const client = new DnspodClient(TENCENT_DNSPOD_clientConfig);
  let _domainList = {};
  try {
    _domainList = await client.DescribeRecordList({ Domain });
  } catch (error) {
    _domainList = { RecordList: [] };
  }

  // 解析List
  const LineTypeArr = ["默认", "电信", "联通", "移动"];
  const DnsPodDomainList = _domainList.RecordList.filter(i => LineTypeArr.includes(i.Line) && i.Name == SubDomain);

  // 取最优选IP IPv4
  const CM_IP_V4 = IP_DATA.v4.CM.reduce((minItem, currentItem) => {
    return currentItem.latency < minItem.latency ? currentItem : minItem;
  }, IP_DATA.v4.CM[0]);
  const CU_IP_V4 = IP_DATA.v4.CU.reduce((minItem, currentItem) => {
    return currentItem.latency < minItem.latency ? currentItem : minItem;
  }, IP_DATA.v4.CU[0]);
  const CT_IP_V4 = IP_DATA.v4.CT.reduce((minItem, currentItem) => {
    return currentItem.latency < minItem.latency ? currentItem : minItem;
  }, IP_DATA.v4.CT[0]);
  const DNS_DATA_V4 = { 移动: CM_IP_V4.ip, 联通: CM_IP_V4.ip, 电信: CU_IP_V4.ip, 默认: CT_IP_V4.ip };

  // 取最优选IP IPv6
  const CM_IP_V6 = IP_DATA.v6.CM.reduce((minItem, currentItem) => {
    return currentItem.latency < minItem.latency ? currentItem : minItem;
  }, IP_DATA.v6.CM[0]);
  const CU_IP_V6 = IP_DATA.v6.CU.reduce((minItem, currentItem) => {
    return currentItem.latency < minItem.latency ? currentItem : minItem;
  }, IP_DATA.v6.CU[0]);
  const CT_IP_V6 = IP_DATA.v6.CT.reduce((minItem, currentItem) => {
    return currentItem.latency < minItem.latency ? currentItem : minItem;
  }, IP_DATA.v6.CT[0]);
  const DNS_DATA_V6 = { 移动: CM_IP_V6.ip, 联通: CM_IP_V6.ip, 电信: CU_IP_V6.ip, 默认: CT_IP_V6.ip };

  // 循环替换优选IP
  DnsPodDomainList.forEach(async i => {
    try {
      const res = await client.ModifyRecord({ Domain, RecordType: i.Type, RecordLine: "", RecordLineId: i.LineId, Value: i.Type == "A" ? DNS_DATA_V4[i.Line] : DNS_DATA_V6[i.Line], RecordId: i.RecordId, SubDomain });
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  });
  return `${moment().format("YYYY.MM.DD HH:mm:ss")} - 腾讯DNSPOD更新成功`;
};
// 更新腾讯DNSPOD DNS结束-----------------------------------------------------------------------------------------------------

module.exports = { updateCloudflareIp };
