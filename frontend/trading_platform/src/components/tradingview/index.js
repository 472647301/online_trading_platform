import React, { useRef, useEffect } from "react";
import { connect } from "react-redux";
import { DataFeed } from "./datafeed";
import IEXCloud from "../../iexAPI/iexCloud";
import axios from "axios";
import day from "dayjs";

const iex = new IEXCloud();

const intervalMap = {
  "10": "5dm",
  "30": "1mm",
  "1D": "1y",
};

function TradingView(props) {
  const container = useRef();
  const datafeed = useRef();
  const interval = useRef("1D");
  const widget = useRef();
  const loadend = useRef(false);

  const initDatafeed = (symbol) => {
    datafeed.current = new DataFeed({
      SymbolInfo: {
        name: symbol,
        full_name: symbol,
        description: "",
        type: "stock",
        session: "24x7",
        exchange: "",
        listed_exchange: "",
        timezone: "Asia/Shanghai",
        format: "price",
        pricescale: Math.pow(10, 4),
        minmov: 1,
        volume_precision: 4,
        has_intraday: true,
        supported_resolutions: Object.keys(intervalMap),
        has_weekly_and_monthly: true,
        has_daily: true,
      },
      DatafeedConfiguration: {
        supported_resolutions: Object.keys(intervalMap),
      },
      getBars: getBars,
    });
  };

  const getBars = async (
    symbolInfo,
    resolution,
    periodParams,
    onResult,
    onError
  ) => {
    const bars = [];
    if (!periodParams.firstDataRequest) {
      // 暂时不支持分段查询历史数据
      onResult(bars, { noData: true });
      return;
    }
    try {
      const res = await axios.get(
        iex.getFullUrl(
          "stock",
          symbolInfo.name,
          "chart",
          `/${intervalMap[resolution]}`
        )
      );
      if (!res.data || !res.data.length) {
        onResult(bars, { noData: true });
        return;
      }
      for (let i = 0; i < res.data.length; i++) {
        let time = 0;
        const item = res.data[i];
        if (item.minute) {
          time = day(`${item.date} ${item.minute}:00`).valueOf();
        } else {
          time = day(`${item.date} 00:00:00`).valueOf();
        }
        bars.push({
          time: time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        });
      }
      bars.sort((l, r) => (l.time > r.time ? 1 : -1));
      onResult(bars);
      loadend.current = true;
    } catch (err) {
      onError(err.message);
    }
  };

  const initTradingView = (symbol) => {
    widget.current = new window.TradingView.widget({
      locale: "zh",
      fullscreen: true,
      theme: "Light",
      symbol: symbol,
      interval: interval.current,
      container: container.current,
      datafeed: datafeed.current,
      // library_path: "http://test.byronzhu.com/tv/charting_library/",
      library_path: "./charting_library/",
    });
  };

  useEffect(() => {
    if (!props.multi || !props.multi.length) {
      return;
    }
    loadend.current = false;
    initDatafeed(props.multi[0].value);
    initTradingView(props.multi[0].value);
  }, [props.multi]);

  useEffect(() => {
    if (!loadend.current || !datafeed.current) return;
    datafeed.current.updateBar({
      time: props.quote.lastTradeTime,
      open: props.quote.open,
      high: props.quote.high,
      low: props.quote.low,
      close: props.quote.latestPrice,
      volume: props.quote.volume,
    });
  }, [props.quote]);

  return (
    <div
      ref={container}
      className="container"
      style={{ height: props.height }}
    />
  );
}

const mapStateToProps = (state) => {
  return {
    quote: state.iexReducer.quote,
    multi: state.searchReducer.multi,
  };
};

export default connect(mapStateToProps)(TradingView);
