"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fp_1 = require("lodash/fp");
var axis_utils_1 = require("./axis_utils");
var d3_utils_1 = require("../../utils/d3_utils");
var Moment = require("moment");
var moment_range_1 = require("moment-range");
var moment = moment_range_1.extendMoment(Moment);
var d3_scale_1 = require("d3-scale");
var d3_time_1 = require("d3-time");
var d3_time_format_1 = require("d3-time-format");
var styles = require("./styles");
// @TODO - add in more options
// Have removed "now", and any formatting to account for change in month/year
var tickFormatter = function (interval) {
    switch (interval) {
        case "hour":
            return d3_time_format_1.timeFormat("%b %d %H:00");
        case "day":
            return d3_time_format_1.timeFormat("%b %d");
        case "week":
            return d3_time_format_1.timeFormat("W%W");
        case "month":
            return d3_time_format_1.timeFormat("%b %y");
        case "quarter":
            return function (d) { return d3_time_format_1.timeFormat("Q" + Math.floor((d.getMonth() + 3) / 3) + " %Y")(d); };
        case "year":
            return d3_time_format_1.timeFormat("%Y");
        default:
            throw new Error("Interval of length " + interval + " is not supported.");
    }
};
var TimeAxis = /** @class */ (function () {
    function TimeAxis(state, stateWriter, events, el, position) {
        this.type = "time";
        this.showRules = false;
        this.state = state;
        this.stateWriter = stateWriter;
        this.events = events;
        this.position = position;
        this.isXAxis = position[0] === "x";
        this.el = axis_utils_1.insertElements(el, this.type, position, this.state.current.get("computed").canvas.drawingDims);
    }
    TimeAxis.prototype.validate = function (value) {
        return fp_1.isDate(value);
    };
    TimeAxis.prototype.updateOptions = function (options) {
        var _this = this;
        fp_1.forEach.convert({ cap: false })(function (value, key) {
            ;
            _this[key] = value;
        })(options);
        if (!this.start || !this.end || !this.interval) {
            throw new Error("Values for `start`, `end` and `interval` must always be configured for time axes.");
        }
        this.adjustMargins();
    };
    TimeAxis.prototype.update = function (options, data) {
        this.updateOptions(options);
        this.data = fp_1.flow(fp_1.filter(this.validate), fp_1.sortBy(function (value) { return value.valueOf(); }))(data);
    };
    // Computations
    TimeAxis.prototype.compute = function () {
        this.previous = fp_1.cloneDeep(this.computed);
        var computed = this.computeInitial();
        computed.tickNumber = this.computeTickNumber(computed.ticksInDomain, computed.range);
        computed.scale = this.computeScale(computed.range, computed.ticksInDomain);
        computed.ticks = this.computeTicks(computed);
        this.computed = computed;
        this.previous = fp_1.defaults(this.computed)(this.previous);
        this.stateWriter(["computed", this.position], this.computed);
        this.stateWriter(["previous", this.position], this.previous);
    };
    TimeAxis.prototype.computeInitial = function () {
        var negativeRange = new Date(this.start).valueOf() > new Date(this.end).valueOf();
        var start = negativeRange ? this.end : this.start;
        var end = negativeRange ? this.start : this.end;
        var ticksInDomain = Array.from(moment.range(start, end).by(this.interval));
        var computed = {};
        computed.tickFormatter = tickFormatter(this.interval);
        computed.ticksInDomain = fp_1.map(function (d) { return d.toDate(); })(negativeRange ? ticksInDomain.reverse() : ticksInDomain);
        computed.tickWidth = this.computeTickWidth(computed.ticksInDomain);
        computed.range = this.computeRange(computed.tickWidth, computed.ticksInDomain.length);
        return computed;
    };
    TimeAxis.prototype.computeTickWidth = function (ticksInDomain) {
        var barSeries = this.state.current.get("computed").series.barSeries;
        if (fp_1.isEmpty(barSeries)) {
            return 0;
        }
        var config = this.state.current.get("config");
        var drawingDims = this.state.current.get("computed").canvas.drawingDims;
        var defaultTickWidth = Math.min(drawingDims[this.isXAxis ? "width" : "height"] / ticksInDomain.length);
        var stacks = fp_1.groupBy(function (s) { return s.stackIndex || fp_1.uniqueId("stackIndex"); })(barSeries);
        var partitionedStacks = fp_1.partition(function (stack) {
            return fp_1.compact(fp_1.map(fp_1.get("barWidth"))(stack)).length > 0;
        })(stacks);
        var fixedWidthStacks = partitionedStacks[0];
        var variableWidthStacks = partitionedStacks[1];
        var requiredTickWidth = fp_1.reduce(function (sum, stack) {
            return sum + stack[0].barWidth;
        }, config.outerBarSpacing)(fixedWidthStacks);
        var variableBarWidth = variableWidthStacks.length > 0
            ? Math.min(Math.max(config.minBarWidth, (defaultTickWidth - requiredTickWidth) / variableWidthStacks.length), config.maxBarWidthRatio * drawingDims[this.isXAxis ? "width" : "height"])
            : 0;
        requiredTickWidth = requiredTickWidth + variableBarWidth * variableWidthStacks.length;
        this.stateWriter("computedBars", this.computeBars(variableBarWidth, requiredTickWidth));
        return Math.max(requiredTickWidth, defaultTickWidth);
    };
    TimeAxis.prototype.computeBars = function (defaultBarWidth, tickWidth) {
        var config = this.state.current.get("config");
        var computedSeries = this.state.current.get("computed").series;
        var indices = fp_1.sortBy(fp_1.identity)(fp_1.uniq(fp_1.values(computedSeries.barIndices)));
        var offset = -tickWidth / 2 + config.outerBarSpacing / 2;
        return fp_1.reduce(function (memo, index) {
            var seriesAtIndex = fp_1.keys(fp_1.pickBy(function (d) { return d === index; })(computedSeries.barIndices));
            var width = computedSeries.barSeries[seriesAtIndex[0]].barWidth || defaultBarWidth;
            fp_1.forEach(function (series) {
                memo[series] = { width: width, offset: offset };
            })(seriesAtIndex);
            offset = offset + width + config.innerBarSpacing;
            return memo;
        }, {})(indices);
    };
    TimeAxis.prototype.computeRange = function (tickWidth, numberOfTicks) {
        return this.isXAxis ? this.computeXRange(tickWidth, numberOfTicks) : this.computeYRange(tickWidth, numberOfTicks);
    };
    TimeAxis.prototype.computeXRange = function (tickWidth, numberOfTicks) {
        var drawingDims = this.state.current.get("computed").canvas.drawingDims;
        var width = tickWidth * numberOfTicks;
        var offset = tickWidth / 2;
        return [offset, (width || drawingDims.width) - offset];
    };
    TimeAxis.prototype.computeYRange = function (tickWidth, numberOfTicks) {
        var computed = this.state.current.get("computed");
        var margin = function (axis) {
            var isRequired = fp_1.includes(axis)(computed.axes.requiredAxes);
            return isRequired ? (computed.axes.margins || {})[axis] || 0 : 0;
        };
        var drawingDims = computed.canvas.drawingDims;
        var width = tickWidth * numberOfTicks;
        var offset = tickWidth / 2;
        return [(drawingDims.height || width) - offset, offset + (margin("x2") || this.minTopOffsetTopTick)];
    };
    TimeAxis.prototype.computeTickNumber = function (ticksInDomain, range) {
        var width = Math.abs(range[1] - range[0]);
        return Math.min(ticksInDomain.length, Math.max(Math.floor(width / this.tickSpacing), this.minTicks));
    };
    TimeAxis.prototype.computeScale = function (range, ticks) {
        return d3_scale_1.scaleTime()
            .range(range)
            .domain([ticks[0], fp_1.last(ticks)]);
    };
    TimeAxis.prototype.computeTicks = function (computed) {
        if (this.interval === "week") {
            var tickInterval = Math.ceil(computed.ticksInDomain.length / computed.tickNumber || 1);
            return computed.scale.ticks(d3_time_1.timeMonday, tickInterval);
        }
        var ticks = computed.scale.ticks(computed.tickNumber || 1);
        return ticks.length > computed.ticksInDomain.length ? computed.ticksInDomain : ticks;
    };
    TimeAxis.prototype.computeAligned = function (computed) {
        this.previous = fp_1.cloneDeep(this.computed);
        computed.tickNumber = this.computeTickNumber(computed.ticksInDomain, computed.range);
        computed.scale = this.computeScale(computed.range, computed.ticksInDomain);
        computed.ticks = this.computeTicks(computed);
        this.computed = computed;
        this.previous = fp_1.defaults(this.computed)(this.previous);
        this.stateWriter(["computed", this.position], this.computed);
        this.stateWriter(["previous", this.position], this.previous);
    };
    // Drawing
    TimeAxis.prototype.draw = function () {
        this.el.attr("transform", "translate(" + axis_utils_1.axisPosition(this.position, this.state.current.get("computed").canvas.drawingDims).join(",") + ")");
        this.drawTicks();
        this.drawBorder();
        axis_utils_1.positionBackgroundRect(this.el, this.state.current.get("config").duration);
    };
    TimeAxis.prototype.drawTicks = function () {
        var config = this.state.current.get("config");
        var attributes = this.getAttributes();
        var startAttributes = this.getStartAttributes(attributes);
        var ticks = this.el
            .selectAll("text." + styles.tick + "." + styles[this.position])
            .data(this.computed.ticks, String);
        ticks
            .enter()
            .append("svg:text")
            .call(d3_utils_1.setTextAttributes, startAttributes)
            .merge(ticks)
            .attr("class", styles.tick + " " + styles[this.position])
            // @TODO
            // .attr("class", (d: string | number, i: number): string => "tick " + this.tickClass(d, i))
            .call(d3_utils_1.setTextAttributes, attributes, config.duration);
        ticks
            .exit()
            .transition()
            .duration(config.duration)
            .call(d3_utils_1.setTextAttributes, fp_1.defaults({ opacity: 1e-6 })(attributes))
            .remove();
        this.adjustMargins();
    };
    TimeAxis.prototype.adjustMargins = function () {
        var computedMargins = this.state.current.get("computed").axes.margins || {};
        var requiredMargin = axis_utils_1.computeRequiredMargin(this.el, computedMargins, this.margin, this.outerPadding, this.position);
        // // Add space for flags
        // const hasFlags: boolean = includes(this.position)(this.state.current.get("computed").series.axesWithFlags)
        // requiredMargin = requiredMargin + (hasFlags ? this.state.current.get("config").axisPaddingForFlags : 0)
        if (computedMargins[this.position] === requiredMargin) {
            return;
        }
        computedMargins[this.position] = requiredMargin;
        this.stateWriter("margins", computedMargins);
        this.events.emit("margins:update", this.isXAxis);
    };
    TimeAxis.prototype.getAttributes = function () {
        return {
            dx: this.isXAxis ? 0 : this.tickOffset,
            dy: this.isXAxis ? this.tickOffset : "0.35em",
            text: this.computed.tickFormatter,
            x: this.isXAxis ? this.computed.scale : 0,
            y: this.isXAxis ? 0 : this.computed.scale,
        };
    };
    TimeAxis.prototype.getStartAttributes = function (attributes) {
        return fp_1.defaults(attributes)({
            x: this.isXAxis ? this.previous.scale : 0,
            y: this.isXAxis ? 0 : this.previous.scale,
        });
    };
    TimeAxis.prototype.drawBorder = function () {
        var drawingDims = this.state.current.get("computed").canvas.drawingDims;
        var border = {
            x1: 0,
            x2: this.isXAxis ? drawingDims.width : 0,
            y1: this.isXAxis ? 0 : drawingDims.height,
            y2: 0,
        };
        this.el.select("line." + styles.border).call(d3_utils_1.setLineAttributes, border);
    };
    TimeAxis.prototype.close = function () {
        this.el.node().remove();
    };
    return TimeAxis;
}());
exports.default = TimeAxis;
//# sourceMappingURL=time_axis.js.map